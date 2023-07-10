// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pool } = require('./connect_db');
async function checkDatabaseTwseDateAndDailyDealDiff(
  db_stocks,
  start_date,
  end_date,
  type,
) {
  try {
    const obj = {};
    for (let i = 0; i < db_stocks.length; i++) {
      const [stock_id, stock_name] = db_stocks[i];
      // get database stock deal date
      const quertText3 = `SELECT TO_CHAR(transaction_date, 'YYYY-MM-DD') as format_date FROM dailydeal WHERE stock_id = '${stock_id}' AND stock_name = '${stock_name}'`;
      let dailydeal_res = await pool.query(quertText3);
      // get database twse date
      const quertText4 = `SELECT TO_CHAR(transaction_date, 'YYYY-MM-DD') as format_date FROM date WHERE transaction_date >= '${start_date}' AND transaction_date <= '${end_date}'`;
      let twsedate_res = await pool.query(quertText4);
      if (dailydeal_res.rows.length > 0) {
        dailydeal_res = dailydeal_res.rows.map((item) => item.format_date);
        twsedate_res = twsedate_res.rows.map((item) => item.format_date);
        const empty_data_date = twsedate_res.filter(
          (item) => !dailydeal_res.includes(item),
        );
        if (empty_data_date.length > 0) {
          if (type === 'id') {
            obj[stock_id] = [stock_name, empty_data_date];
          } else if (type === 'date') {
            for (let e = 0; e < empty_data_date.length; e++) {
              const date = empty_data_date[e];
              obj[date] = obj[date]
                ? [...obj[date], [stock_id, stock_name]]
                : [[stock_id, stock_name]];
            }
          }
        }
      } else {
        console.log(`資料庫無${stock_id}${stock_name} 資料`);
      }
    }
    console.log('交易日期比對完畢');
    return obj;
  } catch (error) {
    console.error('checkDatabaseTwseDateAndDailyDealDiff錯誤：', error);
  }
}

module.exports = checkDatabaseTwseDateAndDailyDealDiff;
