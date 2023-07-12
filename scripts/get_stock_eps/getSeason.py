import requests
from bs4 import BeautifulSoup
import json

try:
    # 連線
    r = requests.get("https://www.cnyes.com/twstock/financial4.aspx") #將此頁面的HTML GET下來
    soup = BeautifulSoup(r.text,"html.parser") #將網頁資料以html.parser

    # 取得所有季選項
    options = soup.select('select[name="ctl00$ContentPlaceHolder1$D3"] option')

    arr = []
    for option in options:
        arr.append(option.text)
    print(json.dumps(arr))
except Exception as e:
    print('fail')