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
    error GR_ZeroAddress();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerGym(address gymAddress, address treasury, string calldata name, uint96 royaltyBps)
        external
        whenNotPaused
    {
        if (gymAddress == address(0) || treasury == address(0)) revert GR_ZeroAddress();
        if (_gyms[gymAddress].gymAddress != address(0)) revert GR_AlreadyRegistered(gymAddress);
        if (!MembershipLib.validateRoyalty(royaltyBps)) {
            revert GR_RoyaltyTooHigh(royaltyBps, MembershipLib.MAX_ROYALTY_BPS);
        }

        MembershipLib.GymInfo storage gym = _gyms[gymAddress];
        gym.gymAddress = gymAddress;
        gym.treasury = treasury;
        gym.name = name;
        gym.royaltyBps = royaltyBps;
        gym.approved = false;

        _gymList.push(gymAddress);

        emit GymRegistered(gymAddress, name, treasury);
    }

    function approveGym(address gymAddress) external onlyOwner whenNotPaused {
        MembershipLib.GymInfo storage gym = _gyms[gymAddress];
        if (gym.gymAddress == address(0)) revert GR_NotRegistered(gymAddress);

        gym.approved = true;

        emit GymApproved(gymAddress);
    }

    function revokeGym(address gymAddress) external onlyOwner {
        MembershipLib.GymInfo storage gym = _gyms[gymAddress];
        if (gym.gymAddress == address(0)) revert GR_NotRegistered(gymAddress);

        gym.approved = false;

        emit GymRevoked(gymAddress);
    }

    function updateTreasury(address newTreasury) external whenNotPaused {
        if (newTreasury == address(0)) revert GR_ZeroAddress();

        MembershipLib.GymInfo storage gym = _gyms[msg.sender];
        if (gym.gymAddress == address(0)) revert GR_NotRegistered(msg.sender);

        address oldTreasury = gym.treasury;
        gym.treasury = newTreasury;

        emit TreasuryUpdated(msg.sender, oldTreasury, newTreasury);
    }
}
