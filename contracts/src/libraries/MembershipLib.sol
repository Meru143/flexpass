// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library MembershipLib {
    struct Tier {
        uint8 tierId;
        string name;
        uint256 pricePerMonth;
        uint256 maxCapacity;
    }

    struct GymInfo {
        address gymAddress;
        address treasury;
        string name;
        uint96 royaltyBps;
        bool approved;
        Tier[] tiers;
    }
}
