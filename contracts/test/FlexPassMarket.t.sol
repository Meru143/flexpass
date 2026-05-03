// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {FlexPassMarket} from "../src/FlexPassMarket.sol";
import {GymMembership} from "../src/GymMembership.sol";
import {GymRegistry} from "../src/GymRegistry.sol";
import {MembershipLib} from "../src/libraries/MembershipLib.sol";

contract FlexPassMarketTest is Test {
    GymRegistry private registry;
    GymMembership private membership;
    FlexPassMarket private market;

    address private constant GYM = address(0x1001);
    address private constant GYM_TREASURY = address(0x2002);
    address private constant PROTOCOL_TREASURY = address(0x3003);
    address private constant ALICE = address(0x4004);
    address private constant BOB = address(0x5005);

    uint256 private constant TOKEN_ID = 1;
    uint256 private constant PRICE = 10 ether;
    uint256 private constant ROYALTY = 1 ether;
    uint256 private constant PROTOCOL_FEE = 0.1 ether;
    uint256 private constant SELLER_PROCEEDS = PRICE - ROYALTY - PROTOCOL_FEE;

    event MembershipListed(uint256 indexed tokenId, address indexed seller, uint256 priceWei);
    event MembershipSold(
        uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 priceWei, uint256 royaltyPaid
    );
    event MembershipDelisted(uint256 indexed tokenId, address indexed seller);
    event PriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);

    function setUp() public {
        registry = new GymRegistry(address(this));
        registry.registerGym(GYM, GYM_TREASURY, "FitZone Mumbai", 1000);
        registry.approveGym(GYM);

        membership = new GymMembership(address(registry), PROTOCOL_TREASURY, address(this));
        market = new FlexPassMarket(address(membership), PROTOCOL_TREASURY, address(this));
        membership.setUserOperator(address(market), true);

        membership.mintMembership(ALICE, GYM, 1, 30);

        vm.deal(ALICE, 100 ether);
        vm.deal(BOB, 100 ether);

        vm.prank(ALICE);
        membership.approve(address(market), TOKEN_ID);
    }

    function test_listMembership_fromAliceSucceedsAndEmitsMembershipListed() public {
        vm.expectEmit(true, true, false, true);
        emit MembershipListed(TOKEN_ID, ALICE, PRICE);

        vm.prank(ALICE);
        market.listMembership(TOKEN_ID, PRICE);

        assertTrue(market.isListed(TOKEN_ID));
    }

    function test_listMembership_fromNonOwnerRevertsWithNotOwner() public {
        vm.prank(BOB);
        vm.expectRevert(abi.encodeWithSelector(FlexPassMarket.MKT_NotOwner.selector, TOKEN_ID));

        market.listMembership(TOKEN_ID, PRICE);
    }

    function test_listMembership_ofExpiredTokenRevertsWithExpired() public {
        uint256 expiresAt = membership.userExpires(TOKEN_ID);
        vm.warp(expiresAt + 1);

        vm.prank(ALICE);
        vm.expectRevert(abi.encodeWithSelector(FlexPassMarket.MKT_Expired.selector, TOKEN_ID));

        market.listMembership(TOKEN_ID, PRICE);
    }

    function test_isListed_returnsTrueAfterListing() public {
        _listToken();

        assertTrue(market.isListed(TOKEN_ID));
    }

    function test_buyMembership_withCorrectValueEmitsMembershipSold() public {
        _listToken();

        vm.expectEmit(true, true, true, true);
        emit MembershipSold(TOKEN_ID, ALICE, BOB, PRICE, ROYALTY);

        vm.prank(BOB);
        market.buyMembership{value: PRICE}(TOKEN_ID);
    }

    function test_buyMembership_transfersOwnershipAndUserToBuyer() public {
        _buyToken();

        assertEq(membership.ownerOf(TOKEN_ID), BOB);
        assertEq(membership.userOf(TOKEN_ID), BOB);
    }

    function test_buyMembership_increasesSellerBalanceByNetProceeds() public {
        _listToken();
        uint256 sellerBalanceBefore = ALICE.balance;

        vm.prank(BOB);
        market.buyMembership{value: PRICE}(TOKEN_ID);

        assertEq(ALICE.balance - sellerBalanceBefore, SELLER_PROCEEDS);
    }

    function test_buyMembership_paysGymTreasuryRoyalty() public {
        _buyToken();

        assertEq(GYM_TREASURY.balance, ROYALTY);
    }

    function test_buyMembership_paysProtocolTreasuryFee() public {
        _buyToken();

        assertEq(PROTOCOL_TREASURY.balance, PROTOCOL_FEE);
    }

    function test_buyMembership_fromSellerRevertsWithSelfBuy() public {
        _listToken();

        vm.prank(ALICE);
        vm.expectRevert(FlexPassMarket.MKT_SelfBuy.selector);

        market.buyMembership{value: PRICE}(TOKEN_ID);
    }

    function test_buyMembership_withWrongValueRevertsWithWrongValue() public {
        _listToken();
        uint256 wrongValue = PRICE - 1;

        vm.prank(BOB);
        vm.expectRevert(abi.encodeWithSelector(FlexPassMarket.MKT_WrongValue.selector, wrongValue, PRICE));

        market.buyMembership{value: wrongValue}(TOKEN_ID);
    }

    function test_delistMembership_byAliceReturnsTokenAndMarksListingInactive() public {
        _listToken();

        vm.prank(ALICE);
        market.delistMembership(TOKEN_ID);

        assertEq(membership.ownerOf(TOKEN_ID), ALICE);
        assertEq(membership.userOf(TOKEN_ID), ALICE);
        assertFalse(market.isListed(TOKEN_ID));
    }

    function test_delistMembership_byBobRevertsWithNotOwner() public {
        _listToken();

        vm.prank(BOB);
        vm.expectRevert(abi.encodeWithSelector(FlexPassMarket.MKT_NotOwner.selector, TOKEN_ID));

        market.delistMembership(TOKEN_ID);
    }

    function test_updatePrice_byAliceChangesPriceAndEmitsPriceUpdated() public {
        _listToken();
        uint256 newPrice = 12 ether;

        vm.expectEmit(true, false, false, true);
        emit PriceUpdated(TOKEN_ID, PRICE, newPrice);

        vm.prank(ALICE);
        market.updatePrice(TOKEN_ID, newPrice);

        MembershipLib.Listing memory listing = market.getListing(TOKEN_ID);
        assertEq(listing.priceWei, newPrice);
    }

    function test_cleanExpiredListing_afterExpirySucceeds() public {
        _listToken();
        uint256 expiresAt = market.getListing(TOKEN_ID).expiresAt;
        vm.warp(expiresAt + 1);

        market.cleanExpiredListing(TOKEN_ID);

        assertEq(membership.ownerOf(TOKEN_ID), ALICE);
        assertFalse(market.isListed(TOKEN_ID));
    }

    function test_cleanExpiredListing_onNonExpiredListingReverts() public {
        _listToken();
        uint64 expiresAt = market.getListing(TOKEN_ID).expiresAt;

        vm.expectRevert(abi.encodeWithSelector(FlexPassMarket.MKT_NotExpired.selector, TOKEN_ID, expiresAt));

        market.cleanExpiredListing(TOKEN_ID);
    }

    function _listToken() private {
        vm.prank(ALICE);
        market.listMembership(TOKEN_ID, PRICE);
    }

    function _buyToken() private {
        _listToken();

        vm.prank(BOB);
        market.buyMembership{value: PRICE}(TOKEN_ID);
    }
}
