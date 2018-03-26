const Api = require('@parity/api')
var BN = require('bignumber.js')

const token = require('../build/contracts/Token.json')

const provider = new Api.Provider.Http('http://localhost:8545')
const api = new Api(provider)

api.parity.pendingTransactions()
  .then((txList, other) => {
    let i = 0
    let txValues = []
    txList.forEach(tx => {
      if(tx.from == '0xb1AF571F1e8bE1182Bb4268380d6d1d8991137A6' ){
        i++
      }
    })
    // console.log(txValues)
    console.log(i)
    process.exit()
  })
  .catch(console.log)
