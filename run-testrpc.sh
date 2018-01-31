#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "$DIR/data"
ganache-cli -m "bonus salon bracket cancel farm foot face stomach gasp capital fee orchard" \
--port=8585 --network-id=256 --gasLimit 0x989680 --db=testrpc-data --blocktime=0

#truffle exec scripts/distribution.js --network=main --sender=0xb1AF571F1e8bE1182Bb4268380d6d1d8991137A6 --contract=0xfe526f986a9ae9e04799c47249077a5c80da9c6c