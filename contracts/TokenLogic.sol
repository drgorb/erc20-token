/// base.sol -- basic ERC20 implementation

// Copyright (C) 2015, 2016, 2017  DappHub, LLC

// Licensed under the Apache License, Version 2.0 (the "License").
// You may not use this file except in compliance with the License.

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND (express or implied).

pragma solidity ^0.4.10;

import "./ERC20.sol";
import "./Stoppable.sol";
import "./Math.sol";
import "./TokenData.sol";

contract TokenLogic is ERC20Events, Math, Stoppable {

    TokenData public data;
    address public token;
    uint public tokensPerWei;
    
    function TokenLogic(address token_, TokenData data_, uint256 supply_, uint tokensPerWei_) {
        assert(token_ != address(0x0));
        assert(tokensPerWei_ > 0);

        if(data_ == address(0x0)) {
            data = new TokenData(this, supply_, msg.sender);
        } else {
            data = data_;
            data.setToken(this);
            data.setSupply(supply_);
        }
        token = token_;
        tokensPerWei = tokensPerWei_;
    }

    modifier tokenOnly {
        assert(msg.sender == token);
        _;
    }    

    function setToken(address token_) auth {
        token = token_;
    }

    function setTokensPerWei(uint tokensPerWei_) auth {
        assert(tokensPerWei_ > 0);
        tokensPerWei = tokensPerWei_;
    }

    function totalSupply() constant returns (uint256) {
        return data.supply();
    }

    function balanceOf(address src) constant returns (uint256) {
        return data.balances(src);
    }

    function allowance(address src, address guy) constant returns (uint256) {
        return data.approvals(src, guy);
    }
    
    function transfer(address src, address dst, uint wad) tokenOnly returns (bool) {
        assert(balanceOf(src) >= wad);
        
        data.setBalances(src, sub(data.balances(src), wad));
        data.setBalances(dst, add(data.balances(dst), wad));
        
        Transfer(src, dst, wad);
        
        return true;
    }
    
    function transferFrom(address src, address dst, uint wad) tokenOnly returns (bool) {
        assert(data.balances(src) >= wad);
        assert(data.approvals(src, dst) >= wad);
        
        data.setApprovals(src, dst, sub(data.approvals(src, dst), wad));
        data.setBalances(src, sub(data.balances(src), wad));
        data.setBalances(dst, add(data.balances(dst), wad));
        
        Transfer(src, dst, wad);
        
        return true;
    }
    
    function approve(address src, address guy, uint256 wad) tokenOnly returns (bool) {

        data.setApprovals(src, guy, wad);
        
        Approval(src, guy, wad);
        
        return true;
    }

    function mint(uint128 wad) tokenOnly {
        data.setBalances(data.owner(), add(data.balances(data.owner()), wad));
        data.setSupply(add(data.supply(), wad));
    }

    function burn(address src, uint128 wad) tokenOnly {
        data.setBalances(src, sub(data.balances(src), wad));
        data.setSupply(sub(data.supply(), wad));
    }

    function handlePayment(address src, uint eth) tokenOnly returns (uint){
        assert(eth > 0);
        uint tokenAmount = mul(tokensPerWei, eth);
        data.setBalances(src, add(data.balances(src), tokenAmount));
        data.setSupply(add(data.supply(), tokenAmount));
        Transfer(this, src, tokenAmount);
        return tokenAmount;
    }
}
