module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8585,
            network_id: "*" // Match any network id
        },

        kovan: {
            from: "0x00E0ffA80874c64C76F711B3129f129590BBab99",
            gas: 4700000,
            host: "62.75.138.247",
            port: 8545,
            network_id: "*" // Match any network id
        }
    }
};
