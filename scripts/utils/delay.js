// 延遲每次證交所請求
function delay() {
  const randomDelay = Math.floor(Math.random() * 7) + 1;
  console.log('等待 ' + randomDelay + ' 秒後進行下一次請求...');
  return new Promise((resolve) => setTimeout(resolve, randomDelay * 1000));
}

module.exports = delay;
