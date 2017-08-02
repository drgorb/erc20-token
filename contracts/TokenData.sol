pragma solidity ^0.4.10;

import "./Auth.sol";

contract TokenData is Auth {
    uint256 public supply;
    mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public approvals;
    address token;

    modifier tokenOnly {
        assert(msg.sender == token);
        _;
    }

    function TokenData(address token_, uint supply_, address owner_) {
        token = token_;
        balances[owner] = supply;
        supply = supply_;
        owner = owner_;
    }

    function setToken(address token_) auth {
        token = token_;
    }

    function setSupply(uint supply_) tokenOnly {
        supply = supply_;
    }

    function setBalances(address guy, uint balance) tokenOnly {
        balances[guy] = balance;
    }

    function setApprovals(address src, address guy, uint wad) tokenOnly {
        approvals[src][guy] = wad;
    }

}