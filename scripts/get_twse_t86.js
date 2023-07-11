// 比對每日交易資料與法人資料是否有缺漏，補齊法人資料
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { transactionsInsertsMultipleData, pool } = require('./utils/connect_db');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const formatTwsePilesString = require('./utils/formatPilesString');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const delay = require('./utils/delay');

function getLegalPersonMissingDataStocks() {
  return new Promise(async (resolve, reject) => {
    try {
      // 取得LegalPerson缺少資料的日期
      const data = {};
      const res =
        await client.query(`SELECT TO_CHAR(dd.transaction_date, 'YYYYMMDD') as format_date, dd.stock_id, dd.stock_name
              FROM DailyDeal dd
              LEFT JOIN LegalPerson lp
                  ON dd.transaction_date = lp.transaction_date
                  AND dd.stock_id = lp.stock_id
                  AND dd.stock_name = lp.stock_name
              WHERE lp.transaction_date IS null AND dd.transaction_date >= '2012-05-17';
              `);
      res.rows.forEach(({ format_date, stock_id, stock_name }) => {
        data[format_date] = data[format_date]
          ? [...data[format_date], [stock_id, stock_name]]
          : [[stock_id, stock_name]];
      });
      resolve(data);
    } catch (error) {
      console.error('getLegalPersonMissingDataStocks error', error);
      reject(error);
    }
  });
}

async function queryLegalPersonData(date, stocks) {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `https://www.twse.com.tw/rwd/zh/fund/T86?date=${date.replace(
        /-/g,
        '',
      )}&selectType=ALLBUT0999&response=json&_=1689082835565
    `;
      const res = await axios.get(url);
      const save_data = [];
      if (res?.data?.data) {
        const data = res?.data?.data;
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const stock_id = row[0];
          const stock_name = row[1].trim();
          const foreign_investors_data = formatTwsePilesString(row[7]);
          const investment_trust_data = formatTwsePilesString(row[10]);
          const dealer_data = formatTwsePilesString(row[11]);
          const index = stocks.findIndex((stock) => stock[0] === stock_id);
          if (
            index !== -1 &&
            stocks[index][1] === stock_name &&
            !isNaN(foreign_investors_data) &&
            !isNaN(investment_trust_data) &&
            !isNaN(dealer_data)
          ) {
            save_data.push([
              date,
              stock_id,
              stock_name,
              foreign_investors_data,
              investment_trust_data,
              dealer_data,
            ]);
          }
        }
      }
      const queryText =
        'INSERT INTO LegalPerson(transaction_date, stock_id, stock_name, foreign_investors, investment_trust, dealer) VALUES($1, $2, $3, $4, $5, $6)';
      await transactionsInsertsMultipleData(queryText, save_data);
      console.log(`日期:${date}，新增${save_data.length}筆`);
      resolve(save_data);
    } catch (error) {
      console.error('queryLegalPersonData error', error);
      reject(error);
    }
  });
}

async function run() {
  client = await pool.connect();
  try {
    const missData = await getLegalPersonMissingDataStocks();
    const dateArr = Object.keys(missData);
    for (let i = 0; i < dateArr.length; i++) {
      await delay();
      const date = dateArr[i];
      await queryLegalPersonData(date, missData[date]);
    }
  } catch (error) {
    console.error('run error', error);
  } finally {
    client.release();
  }
}

void run();
