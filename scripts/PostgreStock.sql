DROP table DailyDeal;
DROP table Date;
DROP table Stock;
DROP table Macd;

CREATE TABLE Date (
    transaction_date		date			primary key 		-- 開市時間
);

CREATE TABLE Stock (
    stock_id				varchar(10)		primary key,		-- 股票代號
    stock_name				varchar(30)		not null unique,	-- 股票名稱
    enabled					boolean			default TRUE		-- 在市場上
);

CREATE TABLE DailyDeal (
	transaction_date		date			not null,	-- 開市時間
    stock_id				varchar(10)		not null,	-- 股票代號
    stock_name				varchar(30)		not null,	-- 股票名稱
    volume					integer			not null,			-- 交易量
    open_price				numeric(10, 2)	not null,			-- 開盤價
    close_price				numeric(10, 2)	not null,			-- 收盤價
    high_price				numeric(10, 2)	not null,			-- 最高價
    low_price				numeric(10, 2)	not null,			-- 最低價
    PRIMARY KEY (transaction_date, stock_id),
    FOREIGN KEY (transaction_date) REFERENCES Date (transaction_date),
    FOREIGN KEY (stock_id) REFERENCES Stock (stock_id),
    FOREIGN KEY (stock_name) REFERENCES Stock (stock_name)
);

CREATE TABLE Macd (
	transaction_date		date			not null,	-- 開市時間
    stock_id				varchar(10)		not null,	-- 股票代號
    stock_name				varchar(30)		not null,	-- 股票名稱
    ema12					numeric(10, 4)	not null,			-- 交易量
    ema26					numeric(10, 4)	not null,			-- 開盤價
    dif9					numeric(10, 3)	not null,			-- 收盤價
    macd					numeric(10, 4)	not null,			-- 最高價
    d_m						numeric(10, 4)	not null,			-- 最低價
    PRIMARY KEY (transaction_date, stock_id),
    FOREIGN KEY (transaction_date) REFERENCES Date (transaction_date),
    FOREIGN KEY (stock_id) REFERENCES Stock (stock_id),
    FOREIGN KEY (stock_name) REFERENCES Stock (stock_name)
);



