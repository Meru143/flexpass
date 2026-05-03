// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {IGymRegistry} from "./interfaces/IGymRegistry.sol";
import {MembershipLib} from "./libraries/MembershipLib.sol";

abstract contract GymRegistry is Ownable2Step, Pausable, IGymRegistry {
    mapping(address => MembershipLib.GymInfo) private _gyms;
    address[] private _gymList;

    event GymRegistered(address indexed gymAddress, string name, address treasury);
    event GymApproved(address indexed gymAddress);
    event GymRevoked(address indexed gymAddress);
    event TreasuryUpdated(address indexed gymAddress, address oldTreasury, address newTreasury);

    error GR_AlreadyRegistered(address gymAddress);
    error GR_NotRegistered(address gymAddress);
    error GR_RoyaltyTooHigh(uint96 provided, uint96 max);

    constructor(address initialOwner) Ownable(initialOwner) {}
}
