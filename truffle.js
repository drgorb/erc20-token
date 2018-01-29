var mnemonic = 'caramel fidgety spotting prominent strangle rebuilt strength drippy visiting joystick heading mandate'

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8585,
            network_id: "*" // Match any network id
        },

        kovan: {
            from: "0x6d8B18F9b737160A73F536393C908FE89961E570",
            gas: 4700000,
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
        },

        main: {
            from: "0x6d8B18F9b737160A73F536393C908FE89961E570",
            gas: 4700000,
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
        }
    }
};
