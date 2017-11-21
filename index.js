const bittrex = require('node-bittrex-api')
const crypto = require('crypto-exchange')
const _ = require('lodash')
const fs = require('fs')
const tech = require('technicalindicators')

process.env.UV_THREADPOOL_SIZE = 128
//const SMA = require('technicalindicators').SMA;
//const SMA = require('technicalindicators').SMA;
tech.setConfig('precision', 8)

bittrex.options({
  'verbose' : false,
  'baseUrlv2' : 'https://bittrex.com/Api/v2.0'
});

let candles = []
let rounds = 1
let targetVol = 250
let interval = 'fiveMin'
let found = false
//let _pairs = pairs(2500)

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

const getCandles = (pair) => {
  return new Promise ((resolve, reject) => {

        bittrex.getcandles({
          marketName: pair,
          tickInterval: interval
        }, (data, err) => {
          if(err) {
            reject(err)
          }
          if (data) {
            let output = {pair: pair, data: data.result}
            resolve(output)
          }
      })
  })
}

const pairs = (minVol) => {
  return new Promise((resolve, reject) => {
    bittrex.getmarketsummaries((data, err) => {
      let result = data.result.filter(cur => {
        return cur.BaseVolume > minVol && cur.MarketName.match(/^(BTC)/g)
      })
      .map(cur => {
        return cur.MarketName
      })
      resolve(result)
    })
  })
}

const tradePair = (arr) => {
  return new Promise((resolve, reject) => {
    let input = arr.data.map(x => x.C).slice(-52)
    let output
    let low = arr.data.map(x => x.L).slice(-3)
    let high = arr.data.map(x => x.H).slice(-3)
    let open = arr.data.map(x => x.O).slice(-3)
    let close = arr.data.map(x => x.C).slice(-3)
    let v = arr.data.map(x => x.V)
    let ema10 = tech.EMA.calculate({period: 10, values: input}).reverse()
    let ema30 = tech.EMA.calculate({period: 30, values: input}).reverse()
    let rsi = tech.RSI.calculate({values: input, period: 14}).reverse()
    let fromBellow = rsi[1] < rsi[0]
    //let threePeriodBull = tech.bullish({open, close, high, low})
    //let psar = tech.PSAR.calculate({high: arr.data.map(x => x.H), low: arr.data.map(x => x.L), step: 0.02, max: 0.2}).reverse()
    let volume = close[2] > open[2] ? RVOL(v.slice(-52), 20).reverse() : 0
    //threePeriodBull ? console.log(arr.pair, 'as bullish pattern') : null
    //let bull = tech.threewhitesoldiers({open, close, high, low})
    if(volume[0] > 1 && rsi[0] > 50 && rsi[0] < 70 && fromBellow && ema10[0] > ema30[0]){
    //if( volume[0] > 1 && input > ema30[0] /*&& rsi[0] > 60 && rsi[0] < 80 && rsi[1] < rsi[0]*/){
      console.log('Trade : ', arr.pair, 'vol = ', volume[0])
      //found = true
      let output = arr.pair
    }
    resolve(output)
  })
}

// const getMarkets = () => {
//   return new Promise((resolve, reject) => {
//     let seq = Promise.resolve()
//     let _pairs = pairs(1000).then(res => {
//       res.forEach(pair => {
//         seq = seq.then(getCandles(pair))
//         .then(res => tradePair)
//         .catch(err => console.log(err, 'Failed to fetch!'))
//       })
//     })
//     .then(res => {
//       console.log('Get markets round ' + rounds + ' finished!')
//       rounds++
//     })
//     .then(res => resolve(res))
//     .catch(err => console.log(err, 'Failed to fetch!'))
//   })
// }

// const getMarkets = () => {
//   return new Promise((resolve, reject) => {
//     let _pairs = pairs(100).then(res => {
//       let marketPromises = res.map(getCandles)
//       Promise.all(marketPromises)
//         .then(res => res.map(tradePair))
//         .then(res => resolve(res))
//         .then(res => {
//           console.log('Get markets round ' + rounds + ' finished!')
//           rounds++
//         })
//         .catch(res => console.log('Error', res))
//     })
//   })
// }
// const getMarkets = () => {
//   return new Promise((resolve, reject) => {
//     let _pairs = pairs(targetVol).then(res => {
//       //let marketPromises = res.map(getCandles)
//       res.reduce((acc, cur) => {
//         return getCandles(cur)
//           //.then(market)
//           .then(res => tradePair(res))
//           .catch(res => console.log('Error', res.message))
//       }, Promise.resolve())
//     })
//   })
// }

const getMarkets = () => {
  let out = []
  return pairs(targetVol).then(res => {
    res.reduce( (promise, res) => {
      return promise.then( () => {
        out.push(getCandles(res)
          .then(res => tradePair(res))
          .catch(res => console.log('Error', res.message))
        );
      })
    }, Promise.resolve())
  })
  .then( () => Promise.all(out))
  .then(res => {
    if(!found)
      setTimeout(y, 60000)
  })
}

const y = () => {
    Promise.resolve(getMarkets())
    .then(res => {
      console.log('Get markets round ' + rounds + ' finished!', new Date())
      rounds++
    })
}

y()
//getMarkets()
// Promise.resolve(getMarkets())
//   .then(res => {
//     console.log('Get markets round ' + rounds + ' finished!', new Date())
//     rounds++
//   })




// JSON.stringify(data.result.reverse(), null, ' ')
// fs.writeFile('candleData.json', _data, (err) => {
//   if(err) throw err
//   console.log('Saved!')
// })


/*bittrex.getcandles({
  marketName: 'BTC-ETC',
  tickInterval: 'thirtyMin' // 'oneMin', 'fiveMin', thirtyMin, 'hour', 'day'
}, (data, err) => {
  if(err) {
    return console.log(err)
  }
  let _data = JSON.stringify(data.result.reverse(), null, ' ')
  fs.writeFile('candleData.json', _data, (err) => {
    if(err) throw err
    console.log('Saved!')
  })
  //console.log('Data for : ' + pair, data.result);
  //let _data = data.result.reverse()
  //.slice(0, 14)
  //JSON.stringify(_data)
  //console.log(_data)
  //let _data = data.result.reverse()
})*/


//const pairs = crypto.bittrex.pairs()
//  .then(res => res.filter(cur => cur.match(/(BTC)$/g)))
//  .then(r => crypto.bittrex.ticker(r))
//  .then(console.log)


// const calc = (initialInv, days, targetProfit) => {
//   result = ''
//   i = 0
//   targetProfit = (targetProfit / 100) + 1
//   do {
//     i++
//     initialInv *= targetProfit
//     console.log('In ' + i + ' days: ', initialInv.toFixed(8))
//   } while (i < days);
// }
//
// calc(0.02, 180, 3)
