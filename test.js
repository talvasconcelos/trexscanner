const tech = require('technicalindicators')
const data = require('./candleData.json')
let volume = data[2].data.map(cur => cur.V)


const RVOL = (vol, period) => {
  let relVol = vol.map((cur, i, arr) => {
    if(i > period) {
      let lookback = vol.slice(i - period, i)
      let avgVol = lookback.reduce((acc, val, index) => {
        acc += val
        if(index === lookback.length - 1)
          return acc / lookback.length
        return acc
      })
      //avgVol = (avgVol / lookback.length)
      return Math.round(cur / avgVol)
    }
  })
  return relVol
}

let open = data[5].data.map(cur => cur.O)
let close = data[5].data.map(cur => cur.C)
let high = data[5].data.map(cur => cur.H)
let low = data[5].data.map(cur => cur.L)

let input = {open, close, high, low}

let out = tech.bullish(input)



// const RVOL = (vol, period) => {
//   let lookback = vol.slice(-(period + 1))
//   let avgVol = lookback.reduce((acc, val, index) => {
//     acc += val
//     if(index === lookback.length - 1)
//       return acc / lookback.length
//     return acc
//   })
// }

//console.log(out.slice(-30))
console.log(out);
