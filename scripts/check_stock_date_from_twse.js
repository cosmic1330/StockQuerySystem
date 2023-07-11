// 檢查證交所股票與資料庫每日交易資料
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const checkDatabaseTwseDateAndDailyDealDiff = require('./utils/diff_date_and_dailydeal');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getDatabaseStockIdList = require('./utils/get_database_stock_id_list');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { transactionsInsertsMultipleData, pool } = require('./utils/connect_db');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const delay = require('./utils/delay');

const args = process.argv.slice(2);
const start_date = args[0] || '2004-02-11'; // $1
const end_date = args[1] || '2023-07-11'; // $2

let db_stocks = [];
let client;

// getTWSEStockDate
// async function getTWSEStockDealById(stock, date) {
//   const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${date}&stockNo=${stock}`;
//   const response = await axios.get(url);
//   const { data } = response;
// }

async function getTWSEStockDealByDate(stocks, date) {
  return new Promise(async (resolve, reject) => {
    console.log(`日期:${date}，開始`);
    try {
      const stockIds = stocks.map((stock) => stock[0]);
      const stockNames = stocks.map((stock) => stock[1]);
      const url = `
    https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?date=${date.replace(
      /-/g,
      '',
    )}&type=ALLBUT0999&response=json&_=1688989064694`;
      const res = await axios.get(url);
      const data = [];
      if (res?.data?.tables) {
        const obj = res.data.tables.find(
          (table) => table?.title?.indexOf('每日收盤行情') > -1,
        );
        obj.data.forEach((stock) => {
          const stockId = stock[0];
          const stockName = stock[1];
          const stockOpen = parseFloat(stock[5]);
          const stockHigh = parseFloat(stock[6]);
          const stockLow = parseFloat(stock[7]);
          const stockClose = parseFloat(stock[8]);
          const stockVolume = parseInt(stock[3].replace(/,/g, ''));
          const index = stockIds.indexOf(stockId);
          if (index > -1 && stockNames[index] === stockName) {
            data.push([
              date,
              stockId,
              stockName,
              stockVolume,
              stockOpen,
              stockClose,
              stockHigh,
              stockLow,
            ]);
          }
        });
      }

      const queryText =
        'INSERT INTO dailydeal(transaction_date, stock_id, stock_name, volume, open_price, close_price, high_price, low_price) VALUES($1, $2, $3, $4, $5, $6, $7, $8)';
      await transactionsInsertsMultipleData(queryText, data);
      resolve(data);
      console.log(`日期:${date}，加入${data.length}筆`);
    } catch (error) {
      console.error(`getTWSEStockDealByDate錯誤：`, error);
      reject(error);
    }
  });
}

async function run() {
  client = await pool.connect();
  try {
    await client.query('BEGIN');
    db_stocks = await getDatabaseStockIdList();
    const obj = await checkDatabaseTwseDateAndDailyDealDiff(
      db_stocks,
      start_date,
      end_date,
      'date',
    );
    const dateArr = Object.keys(obj);
    for (let i = 0; i < dateArr.length; i++) {
      await delay();
      const date = dateArr[i];
      const stocks = obj[date];
      await getTWSEStockDealByDate(stocks, date);
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

run().finally(() => {
  console.log('finally');
});
