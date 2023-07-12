// eslint-disable-next-line @typescript-eslint/no-var-requires
const execAsync = require('../utils/execAsync');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const checkJson = require('../utils/checkjson');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getDatabaseStockIdList = require('../utils/get_database_stock_id_list');
const {
  transactionsInsertsMultipleData,
  pool,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require('../utils/connect_db');

let client;
let missSeason = [];
let missEps = [];
let db_stocks = [];

async function queryDatabaseSeason(client) {
  return new Promise(async (resolve, reject) => {
    try {
      const quertText = `SELECT season FROM epsseason`;
      const res = await client.query(quertText);
      const data = res.rows.map((value) => value.season);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

async function queryDatabaseEps(client) {
  return new Promise(async (resolve, reject) => {
    try {
      const quertText = `SELECT season FROM eps group by season`;
      const res = await client.query(quertText);
      const data = res.rows.map((value) => value.season);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

async function run() {
  client = await pool.connect();
  db_stocks = await getDatabaseStockIdList();
  try {
    // 检查系统是否安装了Python
    const { stderr } = await execAsync('python --version');
    if (stderr) {
      throw new Error('Python未安装，请先安装Python。');
    }

    // 调用 Python 脚本并获取返回值
    const { stdout: seasonOutput, stderr: seasonError } = await execAsync(
      `python ./scripts/get_stock_eps/getSeason.py`,
    );
    if (seasonOutput === 'fail' || seasonError)
      throw new Error('获取季度失败，请检查网络连接。');

    const database_season = await queryDatabaseSeason(client);
    const datavase_eps = await queryDatabaseEps(client);
    if (checkJson(seasonOutput)) {
      // 搜尋缺少的EPS
      missEps = JSON.parse(seasonOutput).filter(
        (value) => !datavase_eps.includes(value),
      );
      // 搜尋缺少的季度
      missSeason = JSON.parse(seasonOutput).filter(
        (value) => !database_season.includes(value),
      );
      const missSeasonData = missSeason.map((value) => [value]);
      const quertText1 = `INSERT INTO epsseason(season) VALUES($1)`;
      await transactionsInsertsMultipleData(quertText1, missSeasonData);
      console.log(`季度新增${missSeason.length}筆資料。`);
    }

    // 取得季度個股EPS
    for (let i = 0; i < missEps.length; i++) {
      const season = missEps[i];
      console.log(`正在取得(${season})Eps...`);
      const { stdout: epsOutput, stderr: epsError } = await execAsync(
        `python ./scripts/get_stock_eps/getEps.py ${season}`,
      );
      if (epsOutput === 'fail' || epsError)
        throw new Error('获取EPS失败，请检查网络连接。');

      if (checkJson(epsOutput)) {
        const missSeasonData = JSON.parse(epsOutput)
          .filter((value) => JSON.stringify(db_stocks).indexOf(value[0]) !== -1)
          .map((value) => [
            season,
            value[0],
            value[1],
            parseFloat(value[7]),
            parseInt(value[2].replace(/,/g, '')) || 0,
            parseInt(value[3].replace(/,/g, '')) || 0,
            parseInt(value[4].replace(/,/g, '')) || 0,
            parseInt(value[5].replace(/,/g, '')) || 0,
            parseInt(value[6].replace(/,/g, '')) || 0,
          ]);
        const quertText2 = `INSERT INTO eps(season, stock_id, stock_name, eps_data, revenue, operating_income, non_operating_income, pre_tax_income, net_income) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
        await transactionsInsertsMultipleData(quertText2, missSeasonData);
        console.log(`(${season})Eps新增${missSeasonData.length}筆資料。`);
      }
    }
  } catch (error) {
    console.error('发生错误:', error);
  }
}

run().finally(() => client.release());
