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

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 priceWei;
        uint256 listedAt;
        uint64 expiresAt;
        bool active;
    }

    struct MembershipInfo {
        uint256 tokenId;
        address gymAddress;
        uint8 tierId;
        uint64 expiresAt;
        address owner;
        address user;
    }
}
