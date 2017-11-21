const candle = require('./candleData.json')

const SMA = (data, length) => {
  let result = data.slice(0, length)
    .map(cur => cur.C)
    .reduce((acc, cur) => acc + cur)
  result /= length
  return result
}

const SMMA = (data, length) => {
  let result = data.slice(0, length)
    .map(cur => cur.C)
    .reduce((acc, cur, i) => {
      let sma = SMA(data, length)
      if(i === 0) return acc + sma
      return acc + ((sma * (length - 1) + cur) / length)
    })
  return result / length
}

// const RSI = (data, length) => {
//
// }
console.log(SMMA(candle, 10))
console.log(SMA(candle, 10))
//console.log(SMA(candle, 30))
