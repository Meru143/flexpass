// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library MembershipLib {
    struct Tier {
        uint8 tierId;
        string name;
        uint256 pricePerMonth;
        uint256 maxCapacity;
    }
}
