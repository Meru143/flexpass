// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MembershipLib} from "../libraries/MembershipLib.sol";

interface IGymRegistry {
    function isApproved(address gymAddress) external view returns (bool);

    function getGymInfo(address gymAddress) external view returns (MembershipLib.GymInfo memory);

    function getTreasury(address gymAddress) external view returns (address);

    function getRoyaltyBps(address gymAddress) external view returns (uint96);
}
