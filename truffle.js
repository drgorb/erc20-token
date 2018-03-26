var mnemonic = 'caramel fidgety spotting prominent strangle rebuilt strength drippy visiting joystick heading mandate'

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8585,
            network_id: "*" // Match any network id
        },

        kovan: {
            gas: 4700000,
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
        },

        main: {
            gas: 4700000,
            host: "localhost",
            port: 8545,
            network_id: "1" // Match any network id
        }
    }
};
