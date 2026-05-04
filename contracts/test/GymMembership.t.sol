// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {GymMembership} from "../src/GymMembership.sol";
import {GymRegistry} from "../src/GymRegistry.sol";

contract GymMembershipTest is Test {
    GymRegistry private registry;
    GymMembership private membership;

    address private constant GYM = address(0x1001);
    address private constant UNAPPROVED_GYM = address(0x1002);
    address private constant GYM_TREASURY = address(0x2002);
    address private constant PROTOCOL_TREASURY = address(0x3003);
    address private constant BUYER = address(0x4004);
    address private constant OTHER = address(0x5005);

    function setUp() public {
        registry = new GymRegistry(address(this));
        registry.registerGym(GYM, GYM_TREASURY, "FitZone Mumbai", 1000);
        registry.approveGym(GYM);
        membership = new GymMembership(address(registry), PROTOCOL_TREASURY, address(this));
    }

    function test_mintMembership_revertsWithUnapprovedGym() public {
        vm.expectRevert(abi.encodeWithSelector(GymMembership.GM_GymNotApproved.selector, UNAPPROVED_GYM));

        membership.mintMembership(BUYER, UNAPPROVED_GYM, 1, 30);
    }

    function test_mintMembership_revertsWithZeroDuration() public {
        vm.expectRevert(GymMembership.GM_ZeroDuration.selector);

        membership.mintMembership(BUYER, GYM, 1, 0);
    }

    function test_mintMembership_returnsTokenIdOneOnFirstMint() public {
        uint256 tokenId = membership.mintMembership(BUYER, GYM, 1, 30);

        assertEq(tokenId, 1);
    }

    function test_mintMembership_setsOwnerToBuyer() public {
        membership.mintMembership(BUYER, GYM, 1, 30);

        assertEq(membership.ownerOf(1), BUYER);
    }

    function test_userOf_returnsBuyerImmediatelyAfterMint() public {
        membership.mintMembership(BUYER, GYM, 1, 30);

        assertEq(membership.userOf(1), BUYER);
    }

    function test_userExpires_equalsBlockTimestampPlusDuration() public {
        uint256 expectedExpiry = block.timestamp + 30 days;

        membership.mintMembership(BUYER, GYM, 1, 30);

        assertEq(membership.userExpires(1), expectedExpiry);
    }

    function test_userOf_returnsZeroAddressAfterExpiry() public {
        membership.mintMembership(BUYER, GYM, 1, 30);
        uint256 expiresAt = membership.userExpires(1);

        vm.warp(expiresAt + 1);

        assertEq(membership.userOf(1), address(0));
    }

    function test_setUser_revertsWhenCallerIsUnauthorized() public {
        membership.mintMembership(BUYER, GYM, 1, 30);
        uint64 expiresAt = uint64(membership.userExpires(1));

        vm.prank(OTHER);
        vm.expectRevert(abi.encodeWithSelector(GymMembership.GM_NotOwner.selector, 1, OTHER));

        membership.setUser(1, OTHER, expiresAt);
    }

    function test_royaltyInfo_returnsGymTreasuryAndTenPercent() public {
        membership.mintMembership(BUYER, GYM, 1, 30);

        (address receiver, uint256 royaltyAmount) = membership.royaltyInfo(1, 1 ether);

        assertEq(receiver, GYM_TREASURY);
        assertEq(royaltyAmount, 0.1 ether);
    }

    function test_transferClearsUserRole() public {
        membership.mintMembership(BUYER, GYM, 1, 30);

        vm.prank(BUYER);
        membership.transferFrom(BUYER, OTHER, 1);

        assertEq(membership.userOf(1), address(0));
    }

    function test_safeTransferClearsUserRole() public {
        PassiveReceiver receiver = new PassiveReceiver();
        membership.mintMembership(BUYER, GYM, 1, 30);

        vm.prank(BUYER);
        membership.safeTransferFrom(BUYER, address(receiver), 1);

        assertEq(membership.userOf(1), address(0));
    }

    function test_mintMembership_withTokenUriSetsUriGymAndTier() public {
        uint256 tokenId = membership.mintMembership(BUYER, GYM, 2, 30, "ipfs://metadata");

        assertEq(membership.tokenURI(tokenId), "ipfs://metadata");
        assertEq(membership.getMembershipGym(tokenId), GYM);
        assertEq(membership.getMembershipTier(tokenId), 2);
    }

    function test_mintMembership_forwardsMsgValueToProtocolTreasury() public {
        uint256 treasuryBalanceBefore = PROTOCOL_TREASURY.balance;

        membership.mintMembership{value: 1 ether}(BUYER, GYM, 1, 30);

        assertEq(PROTOCOL_TREASURY.balance - treasuryBalanceBefore, 1 ether);
        assertEq(address(membership).balance, 0);
    }

    function test_mintMembership_revertsWhenProtocolTreasuryRejectsPayment() public {
        RejectingMintTreasury rejectingTreasury = new RejectingMintTreasury();
        GymMembership rejectingMembership =
            new GymMembership(address(registry), address(rejectingTreasury), address(this));

        vm.expectRevert(
            abi.encodeWithSelector(GymMembership.GM_TransferFailed.selector, address(rejectingTreasury), 1 ether)
        );

        rejectingMembership.mintMembership{value: 1 ether}(BUYER, GYM, 1, 30);
    }

    function test_mintMembership_initializesStateBeforeSafeReceiverCallback() public {
        MintStateReceiver receiver = new MintStateReceiver(membership, GYM, GYM_TREASURY, 2, "ipfs://receiver-metadata");

        membership.mintMembership(address(receiver), GYM, 2, 30, "ipfs://receiver-metadata");

        assertTrue(receiver.checked());
    }

    function test_batchMintMembership_returnsThreeTokenIds() public {
        address[] memory recipients = new address[](3);
        recipients[0] = BUYER;
        recipients[1] = OTHER;
        recipients[2] = address(0x6006);

        string[] memory tokenURIs = new string[](3);

        uint256[] memory tokenIds = membership.batchMintMembership(recipients, GYM, 1, 30, tokenURIs);

        assertEq(tokenIds.length, 3);
        assertEq(tokenIds[0], 1);
        assertEq(tokenIds[1], 2);
        assertEq(tokenIds[2], 3);
    }

    function test_batchMintMembership_revertsWhenArrayLengthsMismatch() public {
        address[] memory recipients = new address[](2);
        recipients[0] = BUYER;
        recipients[1] = OTHER;

        string[] memory tokenURIs = new string[](1);

        vm.expectRevert(abi.encodeWithSelector(GymMembership.GM_LengthMismatch.selector, 2, 1));

        membership.batchMintMembership(recipients, GYM, 1, 30, tokenURIs);
    }

    function test_setProtocolTreasury_updatesTreasuryAndRejectsZeroAddress() public {
        vm.expectRevert(GymMembership.GM_ZeroAddress.selector);
        membership.setProtocolTreasury(address(0));

        membership.setProtocolTreasury(OTHER);

        assertEq(membership.protocolTreasury(), OTHER);
    }

    function test_sweepProtocolFees_sendsStuckBalanceToProtocolTreasury() public {
        uint256 treasuryBalanceBefore = PROTOCOL_TREASURY.balance;
        vm.deal(address(membership), 1 ether);

        membership.sweepProtocolFees();

        assertEq(PROTOCOL_TREASURY.balance - treasuryBalanceBefore, 1 ether);
        assertEq(address(membership).balance, 0);
    }

    function test_pauseCausesMintMembershipToRevert() public {
        membership.pause();

        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));

        membership.mintMembership(BUYER, GYM, 1, 30);
    }

    function test_unpauseRestoresMintMembership() public {
        membership.pause();
        membership.unpause();

        uint256 tokenId = membership.mintMembership(BUYER, GYM, 1, 30);

        assertEq(tokenId, 1);
    }

    function test_supportsInterface_returnsTrueForErc4907AndErc2981() public view {
        assertTrue(membership.supportsInterface(0xad092b5c));
        assertTrue(membership.supportsInterface(0x2a55205a));
    }
}

contract RejectingMintTreasury {
    receive() external payable {
        revert("reject");
    }
}

contract PassiveReceiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}

contract MintStateReceiver {
    GymMembership private immutable membership;
    address private immutable expectedGym;
    address private immutable expectedRoyaltyReceiver;
    uint8 private immutable expectedTier;
    string private expectedTokenUri;

    bool public checked;

    constructor(
        GymMembership membership_,
        address expectedGym_,
        address expectedRoyaltyReceiver_,
        uint8 expectedTier_,
        string memory expectedTokenUri_
    ) {
        membership = membership_;
        expectedGym = expectedGym_;
        expectedRoyaltyReceiver = expectedRoyaltyReceiver_;
        expectedTier = expectedTier_;
        expectedTokenUri = expectedTokenUri_;
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata) external returns (bytes4) {
        if (membership.userOf(tokenId) != address(this)) revert("user not initialized");
        if (membership.getMembershipGym(tokenId) != expectedGym) revert("gym not initialized");
        if (membership.getMembershipTier(tokenId) != expectedTier) revert("tier not initialized");
        if (keccak256(bytes(membership.tokenURI(tokenId))) != keccak256(bytes(expectedTokenUri))) {
            revert("uri not initialized");
        }

        (address royaltyReceiver, uint256 royaltyAmount) = membership.royaltyInfo(tokenId, 1 ether);
        if (royaltyReceiver != expectedRoyaltyReceiver || royaltyAmount != 0.1 ether) {
            revert("royalty not initialized");
        }

        checked = true;

        return this.onERC721Received.selector;
    }
}
