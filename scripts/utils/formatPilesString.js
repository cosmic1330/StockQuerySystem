function formatTwsePilesString(numString) {
  // 檢查numString是否為文字
  if (typeof numString === 'string' || numString instanceof String) {
    const num = parseFloat(numString.replace(/,/g, '')) / 1000;
    const roundedNum = Math.round(num);
    return roundedNum;
  } else {
    return NaN;
  }
}

module.exports = formatTwsePilesString;
