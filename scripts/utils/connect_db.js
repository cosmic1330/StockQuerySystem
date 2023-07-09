// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Pool } = require('pg');
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

// 設定PostgreSQL連接配置
const pool = new Pool({
  user: process.env.DATABASE_USERNAME,
  host: 'localhost',
  database: process.env.DATABASE_HOST,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

async function transactionsInserts(scripts) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < datas.length; i++) {
      const [queryText, data] = scripts[i];
      await client.query(queryText, data);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function transactionsInsertsMultipleData(queryText, datas) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 使用批次插入
    for (let i = 0; i < datas.length; i++) {
      await client.query(queryText, datas[i]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// eslint-disable-next-line prettier/prettier
module.exports = { pool, transactionsInserts, transactionsInsertsMultipleData };
