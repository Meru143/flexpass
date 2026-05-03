// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {FlexPassMarket} from "../src/FlexPassMarket.sol";
import {GymMembership} from "../src/GymMembership.sol";
import {GymRegistry} from "../src/GymRegistry.sol";
import {MembershipLib} from "../src/libraries/MembershipLib.sol";

contract FuzzTest is Test {
    GymRegistry private registry;
    GymMembership private membership;
    FlexPassMarket private market;

    address private constant GYM = address(0x1001);
    address private constant GYM_TREASURY = address(0x2002);
    address private constant PROTOCOL_TREASURY = address(0x3003);
    address private constant ALICE = address(0x4004);
    address private constant BOB = address(0x5005);

    function setUp() public {
        registry = new GymRegistry(address(this));
        registry.registerGym(GYM, GYM_TREASURY, "FitZone Mumbai", 1000);
        registry.approveGym(GYM);

        membership = new GymMembership(address(registry), PROTOCOL_TREASURY, address(this));
        market = new FlexPassMarket(address(membership), PROTOCOL_TREASURY, address(this));
        membership.setUserOperator(address(market), true);

        vm.deal(BOB, 2_000 ether);
    }

    function testFuzz_mintMembership_setsExpiryFromDuration(uint16 durationDays) public {
        vm.assume(durationDays > 0);
        uint256 expectedExpiry = block.timestamp + uint256(durationDays) * 1 days;

        uint256 tokenId = membership.mintMembership(ALICE, GYM, 1, durationDays);

        assertEq(membership.userExpires(tokenId), expectedExpiry);
    }

    function testFuzz_listMembership_storesPrice(uint96 rawPriceWei) public {
        uint256 priceWei = uint256(rawPriceWei);
        uint256 tokenId = membership.mintMembership(ALICE, GYM, 1, 30);

        vm.prank(ALICE);
        membership.approve(address(market), tokenId);

        vm.prank(ALICE);
        market.listMembership(tokenId, priceWei);

        MembershipLib.Listing memory listing = market.getListing(tokenId);
        assertEq(listing.priceWei, priceWei);
    }

    function testFuzz_buyMembership_wrongValueRevertsAndCorrectValueSucceeds(uint96 rawPriceWei, uint96 rawWrongValue)
        public
    {
        uint256 priceWei = bound(uint256(rawPriceWei), 1, 1_000 ether);
        uint256 wrongValue = bound(uint256(rawWrongValue), 0, 1_000 ether);
        if (wrongValue == priceWei) {
            wrongValue = priceWei + 1;
        }

        uint256 tokenId = _mintAndList(priceWei);

        vm.prank(BOB);
        vm.expectRevert(abi.encodeWithSelector(FlexPassMarket.MKT_WrongValue.selector, wrongValue, priceWei));
        market.buyMembership{value: wrongValue}(tokenId);

        vm.prank(BOB);
        market.buyMembership{value: priceWei}(tokenId);

        assertEq(membership.ownerOf(tokenId), BOB);
    }

    function testFuzz_royaltyInfo_returnsSalePriceTimesRoyaltyBps(uint128 salePrice) public {
        uint256 tokenId = membership.mintMembership(ALICE, GYM, 1, 30);

        (, uint256 royaltyAmount) = membership.royaltyInfo(tokenId, uint256(salePrice));

        assertEq(royaltyAmount, uint256(salePrice) * 1000 / 10_000);
    }

    function testFuzz_registerGym_revertsWhenRoyaltyBpsAboveCap(uint96 royaltyBps) public {
        address fuzzGym = address(0x6006);
        address fuzzTreasury = address(0x7007);

        if (royaltyBps > 3000) {
            vm.expectRevert(abi.encodeWithSelector(GymRegistry.GR_RoyaltyTooHigh.selector, royaltyBps, uint96(3000)));
        }

        registry.registerGym(fuzzGym, fuzzTreasury, "Fuzz Gym", royaltyBps);
    }

    function _mintAndList(uint256 priceWei) private returns (uint256 tokenId) {
        tokenId = membership.mintMembership(ALICE, GYM, 1, 30);

        vm.prank(ALICE);
        membership.approve(address(market), tokenId);

        vm.prank(ALICE);
        market.listMembership(tokenId, priceWei);
    }
}
