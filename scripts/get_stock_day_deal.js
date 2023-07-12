// 取得證交所股票每日交易資料
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { transactionsInsertsMultipleData, pool } = require('./utils/connect_db');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const checkJson = require('./utils/checkjson');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const checkDatabaseTwseDateAndDailyDealDiff = require('./utils/diff_date_and_dailydeal');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getDatabaseStockIdList = require('./utils/get_database_stock_id_list');

let db_stocks = [];
let client;
let yahoo_error_stocks = [];
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const end_date = `${year}-${month}-${day}`;
const start_date = '2023-01-09';

// 取得Yahoo股票資料
function queryYahooStocks(url, stock_id, stock_name) {
  return new Promise(async (resolve, reject) => {
    try {
      const api_res = await axios.get(url);
      json_string = api_res.data.replace(/^\(|\);$/g, '');
      if (!checkJson(json_string)) {
        yahoo_error_stocks.push([stock_id, stock_name, 'JSON格式錯誤']);
        resolve([]);
      } else {
        const api_res_data = JSON.parse(json_string);
        if (api_res_data.mem.id === stock_id) {
          resolve(api_res_data.ta);
        } else {
          yahoo_error_stocks.push([stock_id, stock_name, '名稱不符合']);
          resolve([]);
        }
      }
    } catch (error) {
      console.error(`${stock_id}${stock_name} queryYahooStocks錯誤：`, error);
      yahoo_error_stocks.push([stock_id, stock_name, 'API錯誤']);
      reject(error);
    }
  });
}

async function addEmptyDateToDailyDealFromYahoo() {
  return new Promise(async (resolve, reject) => {
    try {
      for (let i = 0; i < db_stocks.length; i++) {
        const stock = db_stocks[i];
        console.log(`正在取得${stock[0]} ${stock[1]}資料`);
        // get database stock deal date
        const queryText1 = `SELECT TO_CHAR(transaction_date, 'YYYYMMDD') as format_date FROM dailydeal WHERE stock_id = '${stock[0]}' AND stock_name = '${stock[1]}'`;
        const db_res = await client.query(queryText1);
        const db_res_date = db_res.rows.map((item) =>
          parseInt(item.format_date),
        );
        // get yahoo stock deal date
        const url = `https://tw.quote.finance.yahoo.net/quote/q?type=ta&perd=d&mkt=10&sym=${stock[0]}&v=1&callback=
                        `;
        const api_res_data = await queryYahooStocks(url, stock[0], stock[1]);
        const empty_date_data = api_res_data
          .filter((item) => {
            return !db_res_date.includes(item.t);
          })
          .map((item) => {
            return [
              `${`${item.t}`.slice(0, 4)}-${`${item.t}`.slice(
                4,
                6,
              )}-${`${item.t}`.slice(6, 8)}`,
              stock[0],
              stock[1],
              item.v,
              item.o,
              item.c,
              item.h,
              item.l,
            ];
          });
        if (empty_date_data.length > 0) {
          const queryText2 =
            'INSERT INTO dailydeal(transaction_date, stock_id, stock_name, volume, open_price, close_price, high_price, low_price) VALUES($1, $2, $3, $4, $5, $6, $7, $8)';
          await transactionsInsertsMultipleData(queryText2, empty_date_data);
        }
      }
      console.log('Yahoo Data寫入資料庫結束');
      resolve();
    } catch (error) {
      console.error('addEmptyDateToDailyDealFromYahoo錯誤：', error);
      reject(error);
    }
  });
}

async function pullEmptyDataFromYahoo(obj) {
  return new Promise(async (resolve, reject) => {
    try {
      const list = Object.keys(obj);
      for (let e = 0; e < list.length; e++) {
        const key = list[e];
        const [stock_name, empty_data_date] = obj[key];
        const url = `https://tw.quote.finance.yahoo.net/quote/q?type=ta&perd=d&mkt=10&sym=${key}&v=1&callback=
                        `;
        const api_res_data = queryYahooStocks(url, key, stock_name);
        for (let i = 0; i < api_res_data.length; i++) {
          const item = api_res_data[i];
          if (empty_data_date.includes(item.t)) {
            if (empty_date_data.length > 0) {
              console.log(`${stock_id} ${stock_name} ${item.t}資料寫入資料庫`);
              const queryText5 =
                'INSERT INTO dailydeal(transaction_date, stock_id, stock_name, volume, open_price, close_price, high_price, low_price) VALUES($1, $2, $3, $4, $5, $6, $7, $8)';
              await transactionsInsertsMultipleData(queryText5, [
                [
                  `${`${item.t}`.slice(0, 4)}-${`${item.t}`.slice(
                    4,
                    6,
                  )}-${`${item.t}`.slice(6, 8)}`,
                  key,
                  stock_name,
                  item.v,
                  item.o,
                  item.c,
                  item.h,
                  item.l,
                ],
              ]);
            }
          }
        }
      }
      console.log('從Yahoo再次拉取資料完畢');
      resolve();
    } catch (error) {
      console.error('pullEmptyData錯誤：', error);
      reject(error);
    }
  });
}

async function run() {
  client = await pool.connect();
  try {
    await client.query('BEGIN');
    db_stocks = await getDatabaseStockIdList();
    await addEmptyDateToDailyDealFromYahoo();
    const obj = await checkDatabaseTwseDateAndDailyDealDiff(
      db_stocks,
      start_date,
      end_date,
      'id',
    );
    await pullEmptyDataFromYahoo(obj);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
  } finally {
    console.log(`錯誤股票代號：${yahoo_error_stocks}`);
  }
}

run().finally(() => {
  client.release();
  console.log('finally');
});
