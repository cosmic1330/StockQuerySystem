// 取得證交所每月市場成交資訊（日期）
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { transactionsInsertsMultipleData, pool } = require('./utils/connect_db');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const delay = require('./utils/delay');

let start_year = 2001;
let start_month_index = 0;
const end_year = `${new Date().getFullYear()}`;
const end_month = new Date().getMonth();
let end_day = null;
const months = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
];

// 請求資料庫最新日期
async function getDBDate() {
  try {
    const quertText =
      "SELECT TO_CHAR(transaction_date, 'YYYY') as year, TO_CHAR(transaction_date, 'MM') as month, TO_CHAR(transaction_date, 'DD') as day FROM date ORDER BY transaction_date DESC LIMIT 1";
    const res = await pool.query(quertText);
    if (res.rows[0]) {
      start_year = res.rows[0].year;
      start_month_index = months.findIndex(
        (month) => month === res.rows[0].month,
      );
      end_day = res.rows[0].day;
      console.log('資料庫最新日期：', start_year, res.rows[0].month, end_day);
    } else {
      console.log('資料庫無資料');
    }
  } catch (error) {
    console.log(error);
  }
}

// 請求證交所每月市場成交資訊（日期）
function makeRequest(year, month) {
  console.log('請求資料：', year, month);
  return new Promise((resolve, reject) => {
    const url = `https://www.twse.com.tw/rwd/zh/afterTrading/FMTQIK?date=${year}${month}01&response=json&_=1688807748857`;
    axios
      .get(url)
      .then((response) => {
        // console.log('回應資料：', response.data);
        const res = response.data;
        const date = [];
        res.data.forEach((item) => {
          const match = /\/(\d{2})$/.exec(item[0]);
          if (end_day !== null) {
            if (year === start_year && month === months[start_month_index]) {
              if (match[1] > end_day) {
                const day = `${year}-${month}-${match[1]}`;
                date.push([day]);
              }
            } else {
              const day = `${year}-${month}-${match[1]}`;
              date.push([day]);
            }
          } else {
            const day = `${year}-${month}-${match[1]}`;
            date.push([day]);
          }
        });
        resolve(date);
      })
      .catch((error) => {
        console.error('錯誤：', error);
        reject(error);
      });
  });
}

// 將證交所每月市場成交資訊（日期）寫入資料庫
async function run() {
  try {
    await getDBDate();
    for (let year = start_year; year <= end_year; year++) {
      for (let i = start_month_index; i < months.length; i++) {
        const month = months[i];
        await delay();
        const res = await makeRequest(year, month);
        if (res.length > 0) {
          queryText = 'INSERT INTO date(transaction_date) VALUES($1)';
          await transactionsInsertsMultipleData(queryText, res);
          console.log('寫入資料庫：', res);
        }
        if (year === end_year && month === months[end_month]) {
          break;
        }
        // 重置 start_month_index
        if (start_month_index !== 0 && i === months.length - 1) {
          start_month_index = 0;
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}
run().finally(() => {
  pool.end().then(() => console.log('資料庫連線已關閉！'));
  console.log('結束！');
});
