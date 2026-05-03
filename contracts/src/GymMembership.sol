// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IERC4907} from "./interfaces/IERC4907.sol";
import {IGymRegistry} from "./interfaces/IGymRegistry.sol";
import {MembershipLib} from "./libraries/MembershipLib.sol";

abstract contract GymMembership is ERC721URIStorage, ERC2981, Ownable2Step, Pausable, ReentrancyGuard, IERC4907 {
    bytes4 private constant _INTERFACE_ID_ERC4907 = 0xad092b5c;

    uint256 private _nextTokenId = 1;
    IGymRegistry public immutable registry;
    address public protocolTreasury;
    mapping(uint256 => IERC4907.UserInfo) private _users;
    mapping(uint256 => address) private _membershipGym;
    mapping(uint256 => uint8) private _membershipTier;

    event MembershipMinted(
        uint256 indexed tokenId, address indexed gymAddress, uint8 tierId, address indexed owner, uint64 expires
    );
    event MembershipBurned(uint256 indexed tokenId);

    error GM_ZeroAddress();
    error GM_GymNotApproved(address gymAddress);

    constructor(address registryAddress, address protocolTreasury_, address initialOwner)
        ERC721("FlexPass Membership", "FLEX")
        Ownable(initialOwner)
    {
        if (registryAddress == address(0) || protocolTreasury_ == address(0)) revert GM_ZeroAddress();

        registry = IGymRegistry(registryAddress);
        protocolTreasury = protocolTreasury_;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721URIStorage, ERC2981, IERC4907)
        returns (bool)
    {
        return interfaceId == _INTERFACE_ID_ERC4907 || super.supportsInterface(interfaceId);
    }
}
