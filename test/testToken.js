var TokenLogic = artifacts.require("./TokenLogic.sol");
var Token = artifacts.require("./Token.sol");

contract('Token', function (accounts) {
    it("has a reference to TokenLogic", () => {
        return TokenLogic.deployed()
            .then(tb => Promise.all([tb.address, Token.deployed()]))
            .then(res => Promise.all([res[0], res[1].logic(), res[1].owner()]))
            .then(res => {
                assert.equal(res[0], res[1], "The token base is referenced");
                assert.equal(res[2], accounts[0], "accounts[0] is the owner");
            });
    });

    it("has a reference in TokenLogic", () => {
        return Token.deployed()
            .then(t => Promise.all([t.address, TokenLogic.deployed()]))
            .then(res => Promise.all([res[0], res[1].token()]))
            .then(res => assert.equal(res[0], res[1], "The token is referenced in token base"));
    });

    it("has accounts[0] as owner", () => {
        return Token.deployed()
            .then(t => t.owner())
            .then(owner => assert.equal(owner, accounts[0], "accounts[0] is the owner"))
    })

    it("has been created with a supply of 0", () => {
        return Token.deployed()
            .then(t => t.totalSupply())
            .then(supply => assert.equal(supply.toNumber(), 0, "no tokens in initial state"));
    });

    it("mints 1000 new token when sent 1 ETH", () => {
        let token = undefined;
        return Token.deployed()
            .then(t => token = t)
            .then(() => web3.eth.sendTransaction({from: accounts[1], to: token.address, value: web3.toWei(1, "ether")}))
            .then(() => Promise.all([token.balanceOf(accounts[1]), token.totalSupply(), web3.eth.getBalance(token.address)]))
            .then(res => {
                assert.equal(res[0].toNumber(), 1e21, "1'000 tokens per ETH balance");
                assert.equal(res[1].toNumber(), 1e21, "1'000 tokens per ETH total supply");
                assert.equal(res[2].toNumber(), 1e18, "1 ETH balance in the contract");
            })
    });

    it("throws when payout is called from another account than the owner", () => {
        let token = undefined;
        return Token.deployed()
            .then(token => token.payout(accounts[1], {from: accounts[2]}))
            .then(t => token = t)
            .then(assert.fail)
            .catch(function (error) {
                assert(
                    error.message.indexOf("invalid opcode") >= 0,
                    "throws when payout is called from another account then the owner"
                )
            });
    })

    it("pays 1 ETH to the designated account", () => {
        let token = undefined;
        let balance = 0;
        return Token.deployed()
            .then(t => token = t)
            .then(() => web3.eth.getBalance(accounts[1]))
            .then(bal => balance = bal)
            .then(() => token.payout(accounts[1]))
            .then(() => Promise.all([web3.eth.getBalance(accounts[1]), web3.eth.getBalance(token.address)]))
            .then(res => {
                assert.equal(res[0].minus(balance).toNumber(), 1e18, "1 ETH additional balance for accounts[1]");
                assert.equal(res[1].toNumber(), 0, "0 ETH balance in the contract");

            });
    });

    it("transfers tokens", () => {
        let token = undefined;
        return Token.deployed()
            .then(t => token = t)
            .then(() => token.transfer(accounts[0], 1e20, {from: accounts[1]}))
            .then(() => Promise.all([token.balanceOf(accounts[1]), token.balanceOf(accounts[0])]))
            .then(res => {
                assert.equal(res[0].toNumber(), 9e20, "1e20 tokens were transfered 9e20 remaining")
                assert.equal(res[1].toNumber(), 1e20, "1e20 tokens were transfered")
            })
    })
})
