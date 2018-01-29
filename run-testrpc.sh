#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "$DIR/data"
ganache-cli -m "bonus salon bracket cancel farm foot face stomach gasp capital fee orchard" \
--port=8585 --network-id=256 --gasLimit 0x989680 --blocktime=2