// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IERC4907} from "./interfaces/IERC4907.sol";
import {MembershipLib} from "./libraries/MembershipLib.sol";

contract FlexPassMarket is Ownable2Step, Pausable, ReentrancyGuard {
    IERC721 public immutable membershipNFT;

    constructor(address membershipAddress, address, address initialOwner) Ownable(initialOwner) {
        membershipNFT = IERC721(membershipAddress);
    }
}
