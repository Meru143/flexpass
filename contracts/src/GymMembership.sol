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

contract GymMembership is ERC721URIStorage, ERC2981, Ownable2Step, Pausable, ReentrancyGuard, IERC4907 {
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
    error GM_ZeroDuration();
    error GM_InsufficientPayment(uint256 sent, uint256 required);
    error GM_NotOwner(uint256 tokenId, address caller);
    error GM_ExpiryOverflow(uint256 expiresAt);

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

    function setUser(uint256 tokenId, address user, uint64 expires) external override {
        address tokenOwner = ownerOf(tokenId);
        if (!_isAuthorized(tokenOwner, msg.sender, tokenId)) revert GM_NotOwner(tokenId, msg.sender);

        _users[tokenId] = IERC4907.UserInfo({user: user, expires: expires});

        emit UpdateUser(tokenId, user, expires);
    }

    function userOf(uint256 tokenId) external view override returns (address) {
        IERC4907.UserInfo memory userInfo = _users[tokenId];

        if (block.timestamp <= userInfo.expires) {
            return userInfo.user;
        }

        return address(0);
    }

    function userExpires(uint256 tokenId) external view override returns (uint256) {
        return _users[tokenId].expires;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);

        if (previousOwner != address(0) && previousOwner != to) {
            delete _users[tokenId];
        }

        if (to == address(0)) {
            emit MembershipBurned(tokenId);
        }

        return previousOwner;
    }

    function mintMembership(address to, address gymAddress, uint8 tierId, uint256 durationDays)
        external
        payable
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId)
    {
        return _mintOne(to, gymAddress, tierId, durationDays, "");
    }

    function _mintOne(address to, address gymAddress, uint8 tierId, uint256 durationDays, string memory tokenUri)
        internal
        returns (uint256 tokenId)
    {
        if (to == address(0) || gymAddress == address(0)) revert GM_ZeroAddress();
        if (!registry.isApproved(gymAddress)) revert GM_GymNotApproved(gymAddress);
        if (durationDays == 0) revert GM_ZeroDuration();

        uint256 expiresAtRaw = block.timestamp + durationDays * 1 days;
        if (expiresAtRaw > type(uint64).max) revert GM_ExpiryOverflow(expiresAtRaw);

        uint64 expiresAt = uint64(expiresAtRaw);
        tokenId = _nextTokenId;

        _safeMint(to, tokenId);
        _users[tokenId] = IERC4907.UserInfo({user: to, expires: expiresAt});

        address gymTreasury = registry.getTreasury(gymAddress);
        if (gymTreasury == address(0)) revert GM_ZeroAddress();

        _setTokenRoyalty(tokenId, gymTreasury, registry.getRoyaltyBps(gymAddress));

        if (bytes(tokenUri).length != 0) {
            _setTokenURI(tokenId, tokenUri);
        }

        _membershipGym[tokenId] = gymAddress;
        _membershipTier[tokenId] = tierId;

        emit MembershipMinted(tokenId, gymAddress, tierId, to, expiresAt);

        ++_nextTokenId;
    }
}
