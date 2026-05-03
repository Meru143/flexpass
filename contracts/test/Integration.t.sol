// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {FlexPassMarket} from "../src/FlexPassMarket.sol";
import {GymMembership} from "../src/GymMembership.sol";
import {GymRegistry} from "../src/GymRegistry.sol";

contract IntegrationTest is Test {
    GymRegistry private registry;
    GymMembership private membership;
    FlexPassMarket private market;

    address private constant GYM = address(0x1001);
    address private constant GYM_TREASURY = address(0x2002);
    address private constant PROTOCOL_TREASURY = address(0x3003);
    address private constant ALICE = address(0x4004);
    address private constant BOB = address(0x5005);

    uint256 private constant PRICE = 10 ether;
    uint256 private constant ROYALTY = 1 ether;
    uint256 private constant PROTOCOL_FEE = 0.1 ether;
    uint256 private constant SELLER_PROCEEDS = PRICE - ROYALTY - PROTOCOL_FEE;

    function setUp() public {
        registry = new GymRegistry(address(this));
        registry.registerGym(GYM, GYM_TREASURY, "FitZone Mumbai", 1000);
        registry.approveGym(GYM);

        membership = new GymMembership(address(registry), PROTOCOL_TREASURY, address(this));
        market = new FlexPassMarket(address(membership), PROTOCOL_TREASURY, address(this));
        membership.setUserOperator(address(market), true);

        vm.deal(BOB, 100 ether);
    }

    function test_completeFlow_registerApproveMintListBuyThenEntryVerify() public {
        uint256 tokenId = _mintApproveAndList(ALICE);

        vm.prank(BOB);
        market.buyMembership{value: PRICE}(tokenId);

        assertEq(membership.ownerOf(tokenId), BOB);
        assertEq(membership.userOf(tokenId), BOB);
    }

    function test_royaltyDistributionAcrossAllThreePartiesInOneTransaction() public {
        uint256 tokenId = _mintApproveAndList(ALICE);
        uint256 aliceBalanceBefore = ALICE.balance;

        vm.prank(BOB);
        market.buyMembership{value: PRICE}(tokenId);

        assertEq(ALICE.balance - aliceBalanceBefore, SELLER_PROCEEDS);
        assertEq(GYM_TREASURY.balance, ROYALTY);
        assertEq(PROTOCOL_TREASURY.balance, PROTOCOL_FEE);
    }

    function test_reentrancy_secondBuyCallFromFallbackReverts() public {
        ReentrantBuyer seller = new ReentrantBuyer(membership, market, PRICE);
        vm.deal(address(seller), PRICE);
        vm.deal(BOB, 100 ether);

        uint256 tokenId = membership.mintMembership(address(seller), GYM, 1, 30);
        seller.setTokenId(tokenId);
        seller.approveAndList();

        vm.prank(BOB);
        market.buyMembership{value: PRICE}(tokenId);

        assertTrue(seller.reentryAttempted());
        assertTrue(seller.reentryReverted());
        assertEq(membership.ownerOf(tokenId), BOB);
    }

    function test_pauseUnpauseFullMarketCycle() public {
        uint256 tokenId = _mintApproveAndList(ALICE);

        market.pause();

        vm.prank(BOB);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        market.buyMembership{value: PRICE}(tokenId);

        market.unpause();

        vm.prank(BOB);
        market.buyMembership{value: PRICE}(tokenId);

        assertEq(membership.ownerOf(tokenId), BOB);
    }

    function _mintApproveAndList(address seller) private returns (uint256 tokenId) {
        tokenId = membership.mintMembership(seller, GYM, 1, 30);

        vm.prank(seller);
        membership.approve(address(market), tokenId);

        vm.prank(seller);
        market.listMembership(tokenId, PRICE);
    }
}

// NOTE: buyMembership only invokes payee fallbacks, so this attacker lists first
// and attempts the reentrant buy when it receives seller proceeds.
contract ReentrantBuyer {
    GymMembership private immutable membership;
    FlexPassMarket private immutable market;
    uint256 private immutable price;
    uint256 private tokenId;

    bool public reentryAttempted;
    bool public reentryReverted;

    constructor(GymMembership membership_, FlexPassMarket market_, uint256 price_) {
        membership = membership_;
        market = market_;
        price = price_;
    }

    receive() external payable {
        if (reentryAttempted) return;

        reentryAttempted = true;

        try market.buyMembership{value: price}(tokenId) {
            reentryReverted = false;
        } catch {
            reentryReverted = true;
        }
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function setTokenId(uint256 tokenId_) external {
        tokenId = tokenId_;
    }

    function approveAndList() external {
        membership.approve(address(market), tokenId);
        market.listMembership(tokenId, price);
    }
}
