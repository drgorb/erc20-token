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

module.exports = function (callback, network) {
  //get the parameter and the value in case of the first format
  let args = process.argv
  let net = args.find(arg => arg.startsWith('--network'))
  //in case of the second format, the args array is extended
  if(args.indexOf('--network') !== -1) {
    net = args[args.indexOf('--network') + 1]
  } else if (net) { //the second format was used
    net = net.substring(10)
  }

  let address = args.find(arg => arg.startsWith('--contract'))
  if(address) {
    address = address.split('=')[1]
  }

  let sender = args.find(arg => arg.startsWith('--sender'))
  if(sender) {
    sender = sender.split('=')[1]
  } else {
    sender = '0x19bd273ec15c59f68ecc45995de43f17f9db792d' //eth.mngn.io
    // let sender = '0x6d8B18F9b737160A73F536393C908FE89961E570' //local
    // let sender = accounts[0]
  }

  console.log(web3.eth.accounts[0], net)

  var stream = fs.createReadStream("scripts/chsb_send.csv")
  let time = (new Date().getTime())
  var csvOutStream = csv.createWriteStream({headers: true}),
    successStream = fs.createWriteStream('distribution-' + net + '.csv')

  successStream.on("finish", function () {
    console.log("DONE!");
  });

  csvOutStream.pipe(successStream)

  let tkn = Token.at(address || Token.address)
  console.log('token address is', tkn.address)
  let rowCount = 0

  let txCount = 0
  let txArray = []
  let errors = {}

  let handleCsvRow = (data, index) => {
    tkn.transfer(data.to, data.chsb_tokens, {gasPrice: 4e9, from: sender})
      .then(tx => {
        txArray[index].status = 'sent'
        rowCount++
        console.log('successfully sent', ++txCount, 'index', index, 'address', data.wallet_confirmed)
        let dateString = (new Date()).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
        let txDate = dateString.split('/')[2]+dateString.split('/')[0]+dateString.split('/')[1]
        data.date = txDate

        csvOutStream.write({
          date: data.date,
          sb_user: data.sb_user,
          wallet_confirmed: data.wallet_confirmed,
          chsb_tokens: data.chsb_tokens,
          transaction: tx.tx
        })
      })
      .catch(err => {
        if(errors[index] > 10) {
          txArray[index].status = 'error'
          console.log('address in error', data.wallet_confirmed)
        } else {
          txArray[index].status = 'unsent'
        }
        errors[index] = errors[index] ? errors[index] + 1 : 1
        console.log('retry on row', index, 'retry', errors[index], err)
      })
  }

  let runTransactions = () => {
    let timerId = setInterval(() => {
      let unsent = txArray.findIndex(row => row.status === 'unsent')
      let sending = txArray.findIndex(row => row.status === 'sending')
      if (unsent > -1) {
        txArray[unsent].status = 'sending'
        handleCsvRow(txArray[unsent], unsent)
      } else if (sending === -1) {
        clearInterval(timerId)
        csvOutStream.end()
        callback()
      }
    }, 100)
  }

  tkn.mint(1e26)
    .then(tx => {
      var csvStream = csv({headers: true})
        .on("data", data => {
          data.status = 'unsent'
          data.chsb_tokens = new bn(data.chsb_tokens).times(1e8).toString(10)
          data.to = add0x(data.wallet_confirmed)
          txArray.push(data)
        })
        .on("end", function () {
          console.log("done")
          runTransactions()
        })

      stream.pipe(csvStream)
    })
    .catch(console.log)

}
