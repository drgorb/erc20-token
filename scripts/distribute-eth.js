// truffle exec scripts/distribute-eth.js --sender=0xb1AF571F1e8bE1182Bb4268380d6d1d8991137A6 --network=main
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

  let sender = args.find(arg => arg.startsWith('--sender'))
  if (sender) {
    sender = sender.split('=')[1]
  } else {
    // sender = '0x19bd273ec15c59f68ecc45995de43f17f9db792d' //eth.mngn.io
    // let sender = '0x6d8B18F9b737160A73F536393C908FE89961E570' //local
    sender = web3.eth.accounts[0]
  }

  console.log(sender, net)

  var stream = fs.createReadStream("scripts/send-eth.csv")
  let time = (new Date().getTime())
  var csvOutStream = csv.createWriteStream({headers: true, delimiter: ';'}),
    successStream = fs.createWriteStream('distribution-eth-' + net + '.csv')

  successStream.on("finish", function () {
    console.log("DONE!");
  });

  csvOutStream.pipe(successStream)

  let rowCount = 0

  let txCount = 0
  let txArray = []
  let errors = {}

  let handleCsvRow = (data, index) => {

    web3.eth.sendTransaction({
        to: data.to,
        value: data.amount,
        gasPrice: 2e9,
        from: sender,
        gas: 50000
      },
      (err, tx) => {
        if (err) {
          tx = tx || err.message
        }
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
          user_id: data.user_id,
          currency: 'ETH',
          amount: new bn(data.amount).dividedBy(1e18),
          chsb_tokens: 0,
          tx_id: tx,
          address: data.wallet_confirmed,
          crypto_transaction_id: data.transaction_id
        })

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
    }, 2000)
  }

  var csvStream = csv({headers: true})
    .on("data", data => {
      data.status = 'unsent'
      data.amount = new bn(data.amount).times(1e18).toString(10)
      data.to = add0x(data.wallet_confirmed)
      txArray.push(data)
    })
    .on("end", function () {
      console.log("done")
      runTransactions()
    })

  stream.pipe(csvStream)

}
