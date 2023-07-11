# StockQuerySystem
由Nestjs＋Postgres建立的Stock data query系統
包含功能
- 股票資訊存取
- throttle資料庫節流
- cache股票資訊

## scripts
|#| 函數名稱 | 功能說明 | 預設 |
|-| ------- | ------ | ---- |
|1.|get_twse_fmtqik|取得開市時間，如果資料庫有資料則從資料庫最新資料的年月開始|2001/1 - now|
|2.|get_twse_bwibbu|取得目前上市股票代號、名稱，並檢查下市股票更新資料庫|N/A|
|3.|get_stock_day_deal|取得Yahoo股票資料，並回補資料庫缺少的資料(適合追朔未來資料)|N/A|
|4.|check_stock_date_from_twse|取得證交所資料，填補Yahoo缺少的資料(適合追朔過去資料)|config\n #證交所歷史紀錄從2004-02-11|
|5.|get_twse_t86|比對交易資料並補齊法人資料|#證交所歷史紀錄2012-05-02|

```shell
# 取得新數據
pnpm getNewStockData
# 取得歷史資料
node ./scripts/check_stock_date_from_twse <start_date>  <end_date>
```