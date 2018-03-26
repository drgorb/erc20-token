var Token = artifacts.require('Token')
var csv = require('fast-csv')
var fs = require('fs')
var bn = require('bignumber.js')

function add0x(input) {
  if (typeof (input) !== 'string') {
    return input;
  }
  else if (input.length < 2 || input.slice(0, 2) !== '0x') {
    return '0x' + input;
  }
  return input;
}

module.exports = function (callback) {
  //get the parameter and the value in case of the first format
  let args = process.argv
  let net = args.find(arg => arg.startsWith('--network'))
  //in case of the second format, the args array is extended
  if (args.indexOf('--network') !== -1) {
    net = args[args.indexOf('--network') + 1]
  } else if (net) { //the second format was used
    net = net.substring(10)
  }

  let address = args.find(arg => arg.startsWith('--contract'))
  if (address) {
    address = address.split('=')[1]
  }

  console.log(web3.eth.accounts[0], net)

  var csvOutStream = csv.createWriteStream({headers: true}),
    successStream = fs.createWriteStream('sent-' + net + '.csv')

  var csvOutStreamFull = csv.createWriteStream({headers: true}),
    successStreamFull = fs.createWriteStream('sent-' + net + '-full.csv')

  successStream.on("finish", function () {
    console.log("DONE!");
  });

  csvOutStream.pipe(successStream)
  csvOutStreamFull.pipe(successStreamFull)

  let tkn = Token.at(address || Token.address)

  let getCsvInArray = (path) => {
    let logRows = fs.readFileSync(path, {encoding: 'utf8'})
    logRows = logRows.split('\n')
    let row = {}
    let headers = []
    let res = []
    for(let i = 0; i < logRows.length; i++) {
      let row = logRows[i].split(',')
      if (i === 0) {
        row.forEach(col => {
          headers.push(col)
        })
      } else {
        let resRow = {}
        row.forEach((col, idx) => {
          resRow[headers[idx]] = col
        })
        res.push(resRow)
      }
    }
    return res
  }

  let logs = getCsvInArray('distribution-main.csv').concat(getCsvInArray('distribution-error-main.csv'))

  tkn.Transfer({}, { fromBlock: 5005279, toBlock: 'latest' }).get((err, res) => {
    res.forEach(event => {
      if(event.args.from == 0xb1AF571F1e8bE1182Bb4268380d6d1d8991137A6){
        let data = logs.find(log => log.transaction.indexOf(event.transactionHash) > -1)
        if(data){
          data.transfered_amount = event.args.value.dividedBy(1e8).toString(10)
          data.transaction = event.transactionHash
          data.recipient = event.args.to
          csvOutStream.write(data)
        }

        csvOutStreamFull.write({
          txhash: event.transactionHash,
          wallet_confirmed: event.args.to,
          value: event.args.value.dividedBy(1e8).toString(10)
        })
      }
    })
    csvOutStream.end()
  })

}
