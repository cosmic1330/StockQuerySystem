// 取得證交所當前股票代碼及名稱
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { transactionsInsertsMultipleData, pool } = require('./utils/connect_db');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getDatabaseStockIdList = require('./utils/get_database_stock_id_list');

let db_stocks = [];
// 請求證交所目前上市股票代碼
function makeRequest() {
  return new Promise((resolve, reject) => {
    const url = `https://www.twse.com.tw/rwd/zh/afterTrading/BWIBBU_d?response=json&_=1688900750130
    `;
    axios
      .get(url)
      .then((response) => {
        const res = response.data;
        const data = res.data.map((item) => {
          return [item[0], item[1]]; // [股票代碼, 股票名稱]
        });
        resolve(data);
      })
      .catch((error) => {
        console.error('錯誤：', error);
        reject(error);
      });
  });
}

void makeRequest()
  .then(async (data) => {
    db_stocks = await getDatabaseStockIdList();
    if (db_stocks.length === 0) {
      queryText = 'INSERT INTO stock(stock_id, stock_name) VALUES($1, $2)';
      await transactionsInsertsMultipleData(queryText, data);
    } else {
      const db_stock_json = db_stocks.map((item) => JSON.stringify(item));
      const new_stocks = data.filter(
        (item) => !db_stock_json.includes(JSON.stringify(item)),
      );

      if (new_stocks.length > 0) {
        console.log(new_stocks);
        queryText = 'INSERT INTO stock(stock_id, stock_name) VALUES($1, $2)';
        await transactionsInsertsMultipleData(queryText, new_stocks);
      }
    }
    return data;
  })
  .then(async (data) => {
    if (db_stocks.length !== 0) {
      const data_json = data.map((item) => JSON.stringify(item));
      const disabled_stocks = db_stocks.filter(
        (item) => !data_json.includes(JSON.stringify(item)),
      );

      if (disabled_stocks.length > 0) {
        queryText =
          'UPDATE stock SET enabled = FALSE WHERE stock_id = $1 AND stock_name = $2';
        await transactionsInsertsMultipleData(queryText, disabled_stocks);

        console.log(`${disabled_stocks.length}筆資料已停止交易`);
      }
    }
  })
  .finally(() => {
    pool.end().then(() => console.log('資料庫連線已關閉！'));
  });
