var TokenLogic = artifacts.require("./TokenLogic.sol");
var TokenData = artifacts.require("./TokenData.sol");

contract('TokenLogic', function (accounts) {
    it("has an TokenData contract for which it is the owner", () => {
        let td = undefined;

        return TokenLogic.deployed()
            .then(instance => {
                td = instance;
                return td.data();
            })
            .then(dataAddr => TokenData.at(dataAddr))
            .then(data => data.owner())
            .then(owner => {
                assert.equal(accounts[0], owner, "TokenLogic is the Account's owner");
            })
    })

    it("has a a linked Token contract", () => {
        return TokenLogic.deployed()
            .then(td => td.token())
            .then(token => assert.notEqual(token, "0x0000000000000000000000000000000000000000", "the token address must be defined"));
    })

    it("has a price of 1 Wei for 1'000 tokens", () => {
        return TokenLogic.deployed()
            .then(td => td.tokensPerWei())
            .then(tpw => assert.equal(tpw.toNumber(), 1000, "the price for 1 Wei is 1'000 tokens"));
    })

})