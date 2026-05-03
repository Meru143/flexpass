// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

import {FlexPassMarket} from "../src/FlexPassMarket.sol";
import {GymMembership} from "../src/GymMembership.sol";
import {GymRegistry} from "../src/GymRegistry.sol";

contract Deploy is Script {
    function run() external returns (GymRegistry registry, GymMembership membership, FlexPassMarket market) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address protocolTreasury = vm.envAddress("PROTOCOL_TREASURY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        registry = new GymRegistry(deployer);
        membership = new GymMembership(address(registry), protocolTreasury, deployer);
        market = new FlexPassMarket(address(membership), protocolTreasury, deployer);
        membership.setUserOperator(address(market), true);

        vm.stopBroadcast();

        console.log("GymRegistry:", address(registry));
        console.log("GymMembership:", address(membership));
        console.log("FlexPassMarket:", address(market));
    }
}
