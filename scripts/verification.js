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
  if(address) {
    address = address.split('=')[1]
  }

  console.log(web3.eth.accounts[0], net)

  var stream = fs.createReadStream('distribution-' + net + '.csv')
  var csvOutStream = csv.createWriteStream({headers: true}),
    successStream = fs.createWriteStream('verification-' + net + '.csv')

  successStream.on("finish", function () {
    console.log("DONE!");
  });

  csvOutStream.pipe(successStream)

  let tkn = Token.at(address || Token.address)

  let rowCount = 0
  let currentRow = 0

  var csvStream = csv({headers: true})
    .on("data", data => {
      rowCount++
      let receipt = web3.eth.getTransactionReceipt(data.transaction)
      let result = {
        status: receipt ? receipt.status : -1,
        chsb_tokens: data.chsb_tokens,
        wallet_confirmed: data.wallet_confirmed
      }
      tkn.balanceOf(data.wallet_confirmed)
        .then(balance => {
          result.balance = balance.toString(10)
          result.transaction_hash = data.transaction
          console.log(result)
          csvOutStream.write(result)
          if (++currentRow >= rowCount) {
            csvOutStream.end()
          }
        })
    })
    .on("end", function () {
      console.log("done")
    })

  stream.pipe(csvStream)

}
