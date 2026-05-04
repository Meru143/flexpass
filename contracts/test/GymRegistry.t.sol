// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {GymRegistry} from "../src/GymRegistry.sol";

contract GymRegistryTest is Test {
    GymRegistry private registry;

    address private constant GYM = address(0x1001);
    address private constant TREASURY = address(0x2002);
    address private constant NEW_TREASURY = address(0x3003);
    address private constant NON_OWNER = address(0x4004);

    event GymRegistered(address indexed gymAddress, string name, address treasury);

    function setUp() public {
        registry = new GymRegistry(address(this));
    }

    function test_registerGym_emitsGymRegistered() public {
        vm.expectEmit(true, true, false, true);
        emit GymRegistered(GYM, "FitZone Mumbai", TREASURY);

        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);
    }

    function test_registerGym_revertsWithZeroTreasury() public {
        vm.expectRevert(GymRegistry.GR_ZeroAddress.selector);

        registry.registerGym(GYM, address(0), "FitZone Mumbai", 1000);
    }

    function test_registerGym_revertsWhenRoyaltyTooHigh() public {
        vm.expectRevert(abi.encodeWithSelector(GymRegistry.GR_RoyaltyTooHigh.selector, uint96(3001), uint96(3000)));

        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 3001);
    }

    function test_registerGym_revertsWhenDuplicate() public {
        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);

        vm.expectRevert(abi.encodeWithSelector(GymRegistry.GR_AlreadyRegistered.selector, GYM));

        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);
    }

    function test_approveGym_revertsWhenCalledByNonOwner() public {
        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);

        vm.prank(NON_OWNER);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", NON_OWNER));

        registry.approveGym(GYM);
    }

    function test_isApproved_returnsFalseBeforeApproval() public {
        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);

        assertFalse(registry.isApproved(GYM));
    }

    function test_isApproved_returnsTrueAfterApproval() public {
        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);

        registry.approveGym(GYM);

        assertTrue(registry.isApproved(GYM));
    }

    function test_revokeGym_setsApprovedFalse() public {
        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);
        registry.approveGym(GYM);

        registry.revokeGym(GYM);

        assertFalse(registry.isApproved(GYM));
    }

    function test_updateTreasury_succeedsForGymAndRevertsForOtherAddress() public {
        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);

        vm.prank(GYM);
        registry.updateTreasury(NEW_TREASURY);

        assertEq(registry.getTreasury(GYM), NEW_TREASURY);

        vm.prank(NON_OWNER);
        vm.expectRevert(abi.encodeWithSelector(GymRegistry.GR_NotRegistered.selector, NON_OWNER));

        registry.updateTreasury(NEW_TREASURY);
    }

    function test_getGymInfo_returnsRegisteredGymDetails() public {
        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);

        assertEq(registry.getGymInfo(GYM).gymAddress, GYM);
        assertEq(registry.getGymInfo(GYM).treasury, TREASURY);
        assertEq(registry.getGymInfo(GYM).name, "FitZone Mumbai");
        assertEq(registry.getGymInfo(GYM).royaltyBps, 1000);
        assertEq(registry.getTreasury(GYM), TREASURY);
        assertEq(registry.getRoyaltyBps(GYM), 1000);
    }

    function test_getAllGyms_returnsCorrectCountAfterRegistration() public {
        address secondGym = address(0x5005);

        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);
        registry.registerGym(secondGym, NEW_TREASURY, "GoldGym Pune", 1000);

        address[] memory gyms = registry.getAllGyms();

        assertEq(gyms.length, 2);
        assertEq(gyms[0], GYM);
        assertEq(gyms[1], secondGym);
    }

    function test_getApprovedGyms_returnsOnlyApprovedGyms() public {
        address secondGym = address(0x5005);

        registry.registerGym(GYM, TREASURY, "FitZone Mumbai", 1000);
        registry.registerGym(secondGym, NEW_TREASURY, "GoldGym Pune", 1000);
        registry.approveGym(GYM);

        address[] memory approvedGyms = registry.getApprovedGyms();

        assertEq(approvedGyms.length, 1);
        assertEq(approvedGyms[0], GYM);
    }
}
