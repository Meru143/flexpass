// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

import {FlexPassMarket} from "../src/FlexPassMarket.sol";
import {GymMembership} from "../src/GymMembership.sol";
import {GymRegistry} from "../src/GymRegistry.sol";

contract SeedTestData is Script {
    address private constant FITZONE_GYM = address(0x1000000000000000000000000000000000000001);
    address private constant FITZONE_TREASURY = address(0x1000000000000000000000000000000000000011);
    address private constant GOLDGYM_GYM = address(0x2000000000000000000000000000000000000002);
    address private constant GOLDGYM_TREASURY = address(0x2000000000000000000000000000000000000022);

    function run() external returns (GymRegistry registry, GymMembership membership, FlexPassMarket market) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address protocolTreasury = vm.envAddress("PROTOCOL_TREASURY");
        address testMember = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        registry = new GymRegistry(testMember);
        membership = new GymMembership(address(registry), protocolTreasury, testMember);
        market = new FlexPassMarket(address(membership), protocolTreasury, testMember);
        membership.setUserOperator(address(market), true);

        registry.registerGym(FITZONE_GYM, FITZONE_TREASURY, "FitZone Mumbai", 1000);
        registry.registerGym(GOLDGYM_GYM, GOLDGYM_TREASURY, "GoldGym Pune", 1000);

        registry.approveGym(FITZONE_GYM);
        registry.approveGym(GOLDGYM_GYM);

        uint256 firstTokenId = membership.mintMembership(testMember, FITZONE_GYM, 1, 30);
        membership.mintMembership(testMember, FITZONE_GYM, 1, 30);
        membership.mintMembership(testMember, GOLDGYM_GYM, 1, 30);

        membership.approve(address(market), firstTokenId);
        market.listMembership(firstTokenId, 10 ether);

        vm.stopBroadcast();

        console.log("Seed GymRegistry:", address(registry));
        console.log("Seed GymMembership:", address(membership));
        console.log("Seed FlexPassMarket:", address(market));
        console.log("Listed tokenId:", firstTokenId);
    }
}
