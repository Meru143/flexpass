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
    error MKT_NotListed(uint256 tokenId);
    error MKT_Expired(uint256 tokenId);
    error MKT_WrongValue(uint256 sent, uint256 required);
    error MKT_SelfBuy();
    error MKT_InactiveListing();
    error MKT_OwnerMismatch(uint256 tokenId);
    error MKT_ExpiryOverflow(uint256 expiresAt);
    error MKT_ZeroAddress();
    error MKT_InvalidSettlement(uint256 priceWei, uint256 royaltyAmount, uint256 protocolFee);
    error MKT_TransferFailed(address recipient, uint256 amount);
    error MKT_NotExpired(uint256 tokenId, uint64 expiresAt);
    error MKT_FeeTooHigh(uint256 newBps, uint256 maxBps);

    constructor(address membershipAddress, address protocolTreasury_, address initialOwner) Ownable(initialOwner) {
        if (membershipAddress == address(0) || protocolTreasury_ == address(0)) revert MKT_ZeroAddress();

        membershipNFT = IERC721(membershipAddress);
        protocolTreasury = protocolTreasury_;
    }

    function listMembership(uint256 tokenId, uint256 priceWei) external whenNotPaused nonReentrant {
        if (membershipNFT.ownerOf(tokenId) != msg.sender) revert MKT_NotOwner(tokenId);
        if (_listings[tokenId].active) revert MKT_AlreadyListed(tokenId);

        uint256 expiresAtRaw = IERC4907(address(membershipNFT)).userExpires(tokenId);
        if (expiresAtRaw <= block.timestamp) revert MKT_Expired(tokenId);
        if (expiresAtRaw > type(uint64).max) revert MKT_ExpiryOverflow(expiresAtRaw);

        // Cast is safe after the explicit type(uint64).max guard above.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 expiresAt = uint64(expiresAtRaw);
        _listings[tokenId] = MembershipLib.Listing({
            tokenId: tokenId,
            seller: msg.sender,
            priceWei: priceWei,
            listedAt: block.timestamp,
            expiresAt: expiresAt,
            active: true
        });

        emit MembershipListed(tokenId, msg.sender, priceWei);

        membershipNFT.transferFrom(msg.sender, address(this), tokenId);
    }

    function buyMembership(uint256 tokenId) external payable whenNotPaused nonReentrant {
        MembershipLib.Listing storage listing = _listings[tokenId];
        if (!listing.active) revert MKT_InactiveListing();

        address seller = listing.seller;
        if (msg.sender == seller) revert MKT_SelfBuy();
        if (membershipNFT.ownerOf(tokenId) != address(this)) revert MKT_OwnerMismatch(tokenId);

        uint256 priceWei = listing.priceWei;
        if (msg.value != priceWei) revert MKT_WrongValue(msg.value, priceWei);

        (address royaltyReceiver, uint256 royaltyAmount) =
            IERC2981(address(membershipNFT)).royaltyInfo(tokenId, msg.value);
        uint256 protocolFee = msg.value * protocolFeeBps / 10_000;
        if (royaltyAmount + protocolFee > msg.value) {
            revert MKT_InvalidSettlement(msg.value, royaltyAmount, protocolFee);
        }

        uint256 sellerProceeds = msg.value - royaltyAmount - protocolFee;
        uint64 expiresAt = listing.expiresAt;
        listing.active = false;

        membershipNFT.transferFrom(address(this), msg.sender, tokenId);
        IERC4907(address(membershipNFT)).setUser(tokenId, msg.sender, expiresAt);

        emit MembershipSold(tokenId, seller, msg.sender, priceWei, royaltyAmount);

        _sendValue(royaltyReceiver, royaltyAmount);
        _sendValue(protocolTreasury, protocolFee);
        _sendValue(seller, sellerProceeds);
    }

    function delistMembership(uint256 tokenId) external whenNotPaused nonReentrant {
        MembershipLib.Listing storage listing = _listings[tokenId];
        if (!listing.active) revert MKT_InactiveListing();

        address seller = listing.seller;
        if (seller != msg.sender) revert MKT_NotOwner(tokenId);
        if (membershipNFT.ownerOf(tokenId) != address(this)) revert MKT_OwnerMismatch(tokenId);

        uint64 expiresAt = listing.expiresAt;
        listing.active = false;

        emit MembershipDelisted(tokenId, msg.sender);

        membershipNFT.transferFrom(address(this), msg.sender, tokenId);
        IERC4907(address(membershipNFT)).setUser(tokenId, msg.sender, expiresAt);
    }

    function updatePrice(uint256 tokenId, uint256 newPriceWei) external {
        MembershipLib.Listing storage listing = _listings[tokenId];
        if (!listing.active) revert MKT_InactiveListing();
        if (listing.seller != msg.sender) revert MKT_NotOwner(tokenId);

        uint256 oldPrice = listing.priceWei;
        emit PriceUpdated(tokenId, oldPrice, newPriceWei);

        listing.priceWei = newPriceWei;
    }

    function cleanExpiredListing(uint256 tokenId) external nonReentrant {
        MembershipLib.Listing storage listing = _listings[tokenId];
        if (!listing.active) revert MKT_InactiveListing();

        uint256 expiresAtRaw = IERC4907(address(membershipNFT)).userExpires(tokenId);
        if (expiresAtRaw == 0) {
            expiresAtRaw = listing.expiresAt;
        }
        if (expiresAtRaw > type(uint64).max) revert MKT_ExpiryOverflow(expiresAtRaw);
        if (expiresAtRaw > block.timestamp) {
            // Cast is safe after the explicit type(uint64).max guard above.
            // forge-lint: disable-next-line(unsafe-typecast)
            revert MKT_NotExpired(tokenId, uint64(expiresAtRaw));
        }
        if (membershipNFT.ownerOf(tokenId) != address(this)) revert MKT_OwnerMismatch(tokenId);

        address seller = listing.seller;
        listing.active = false;

        emit MembershipDelisted(tokenId, seller);

        membershipNFT.transferFrom(address(this), seller, tokenId);
    }

    function getListing(uint256 tokenId) external view returns (MembershipLib.Listing memory) {
        return _listings[tokenId];
    }

    function isListed(uint256 tokenId) external view returns (bool) {
        return _listings[tokenId].active;
    }

    function setProtocolFeeBps(uint256 newBps) external onlyOwner {
        if (newBps > 500) revert MKT_FeeTooHigh(newBps, 500);

        protocolFeeBps = newBps;
    }

    function setProtocolTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert MKT_ZeroAddress();

        protocolTreasury = newTreasury;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _sendValue(address recipient, uint256 amount) private {
        if (amount == 0) return;
        if (recipient == address(0)) revert MKT_ZeroAddress();

        (bool success,) = recipient.call{value: amount}("");
        if (!success) revert MKT_TransferFailed(recipient, amount);
    }
}
