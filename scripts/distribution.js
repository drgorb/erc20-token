// mainnet - truffle exec scripts/distribution.js --sender=0xb1AF571F1e8bE1182Bb4268380d6d1d8991137A6 --contract=0xba9d4199faB4f26eFE3551D490E3821486f135Ba --network=main
// kovan - truffle exec scripts/distribution.js --sender=0x0089b397DefaEe0385eCe6851978432041d03451 --contract=0xcefd02aaa1656f00f2b15a5fd2b26de2d203145f --network=kovan
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
//t.transfer(transfer.recipient, transfer.amount, {from: sender, gasPrice: 2.4e10, nonce:
// transfer.nonce, gas: 200000})
module.exports = function (callback, network) {
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

  let sender = args.find(arg => arg.startsWith('--sender'))
  if (sender) {
    sender = sender.split('=')[1]
  } else {
    // sender = '0x19bd273ec15c59f68ecc45995de43f17f9db792d' //eth.mngn.io
    // let sender = '0x6d8B18F9b737160A73F536393C908FE89961E570' //local
    sender = web3.eth.accounts[0]
  }

  console.log(sender, net)

  var stream = fs.createReadStream("scripts/send.csv")
  let time = (new Date().getTime())
  var csvOutStream = csv.createWriteStream({headers: true}),
    successStream = fs.createWriteStream('distribution-' + net + '.csv')
  var csvOutStreamErr = csv.createWriteStream({headers: true}),
    errortream = fs.createWriteStream('distribution-error-' + net + '.csv')

  successStream.on("finish", function () {
    console.log("DONE!");
  });
  errortream.on("finish", function () {
    console.log("DONE!");
  });

  csvOutStream.pipe(successStream)
  csvOutStreamErr.pipe(errortream)

  let tkn = Token.at(address || Token.address)
  console.log('token address is', tkn.address)
  let rowCount = 0

  let txCount = 0
  let txArray = []
  let txQueue = []

  let handleCsvRow = (data, index) => {

    tkn.transfer(data.to, data.chsb_tokens, {gasPrice: 2e9, from: sender, gas: 200000})
      .then(tx => {
        txQueue.push(tx.tx) // add tx hash to queue
        txArray[index].status = 'sent'
        rowCount++
        console.log('successfully sent', ++txCount, 'index', index, 'address', data.wallet_confirmed)
        let dateString = (new Date()).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
        let txDate = dateString.split('/')[2] + dateString.split('/')[0] + dateString.split('/')[1]
        data.date = txDate

        csvOutStream.write({
          date: data.date,
          sb_user: data.sb_user,
          wallet_confirmed: data.wallet_confirmed,
          chsb_tokens: new bn(data.chsb_tokens).dividedBy(1e8),
          transaction: tx.tx
        })
      })
      .catch(err => {
        txArray[index].status = 'sent'
        rowCount++
        console.log('error sending', ++txCount, 'index', index, 'address', data.wallet_confirmed, err.message.split('\n')[0])
        let dateString = (new Date()).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
        let txDate = dateString.split('/')[2] + dateString.split('/')[0] + dateString.split('/')[1]
        data.date = txDate

        csvOutStreamErr.write({
          date: data.date,
          sb_user: data.sb_user,
          wallet_confirmed: data.wallet_confirmed,
          chsb_tokens: new bn(data.chsb_tokens).dividedBy(1e8),
          transaction: err.message.split('\n')[0]
        })
      })
  }

  let runTransactions = () => {
    let timerId = setInterval(() => {
      let receipts = []
      txQueue.forEach((tx, idx) => {
        let receipt = web3.eth.getTransactionReceipt(tx)
        if(receipt) {
          receipts.push(idx)
        }
      })

      for(let i = receipts.length - 1; i >= 0; i--) {
        txQueue.splice(receipts[i], 1)
      }

      if(txQueue.length >= 5) return

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
    }, 2000)
  }

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

}
