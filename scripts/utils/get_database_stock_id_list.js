// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pool } = require('./connect_db');

// 請求資料庫目前股票
async function getDatabaseStockIdList() {
  return new Promise(async (resolve, reject) => {
    let db_stocks = [];
    try {
      const quertText =
        'SELECT stock_id, stock_name FROM stock WHERE enabled = TRUE';
      const res = await pool.query(quertText);
      if (res.rows.length > 0) {
        db_stocks = res.rows.map((item) => [item.stock_id, item.stock_name]);
        console.log('匯入資料庫股票完畢');
      } else {
        console.log('資料庫無資料');
      }
      resolve(db_stocks);
    } catch (error) {
      console.error('getDatabaseStock錯誤：', error);
      reject(error);
    }
  });
}

module.exports = getDatabaseStockIdList;
