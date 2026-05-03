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
    address public protocolTreasury;
    mapping(uint256 => MembershipLib.Listing) private _listings;
    uint256 public protocolFeeBps = 100;

    event MembershipListed(uint256 indexed tokenId, address indexed seller, uint256 priceWei);
    event MembershipSold(
        uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 priceWei, uint256 royaltyPaid
    );
    event MembershipDelisted(uint256 indexed tokenId, address indexed seller);
    event PriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);

    error MKT_NotOwner(uint256 tokenId);
    error MKT_AlreadyListed(uint256 tokenId);

    constructor(address membershipAddress, address protocolTreasury_, address initialOwner) Ownable(initialOwner) {
        membershipNFT = IERC721(membershipAddress);
        protocolTreasury = protocolTreasury_;
    }
}
