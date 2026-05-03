import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  GymMembership as GymMembershipContract,
  MembershipMinted,
  UpdateUser,
} from "../generated/GymMembership/GymMembership";
import {
  MembershipDelisted,
  MembershipListed,
  MembershipSold,
} from "../generated/FlexPassMarket/FlexPassMarket";
import {
  GymApproved,
  GymRegistered,
  GymRegistry as GymRegistryContract,
} from "../generated/GymRegistry/GymRegistry";
import { Gym, Listing, Membership, MembershipTransaction } from "../generated/schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function zeroAddress(): Address {
  return Address.fromString(ZERO_ADDRESS);
}

function transactionId(event: ethereum.Event): string {
  return event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString());
}

function membershipId(tokenId: BigInt): string {
  return tokenId.toString();
}

function readTokenUri(event: MembershipMinted): string {
  const contract = GymMembershipContract.bind(event.address);
  const result = contract.try_tokenURI(event.params.tokenId);

  return result.reverted ? "" : result.value;
}

function readRoyaltyBps(event: GymRegistered): i32 {
  const contract = GymRegistryContract.bind(event.address);
  const result = contract.try_getRoyaltyBps(event.params.gymAddress);

  return result.reverted ? 0 : result.value.toI32();
}

function saveTransaction(
  event: ethereum.Event,
  transactionType: string,
  membership: string,
  from: Address,
  to: Address | null,
  priceWei: BigInt | null,
  royaltyPaid: BigInt | null
): void {
  const transaction = new MembershipTransaction(transactionId(event));
  transaction.type = transactionType;
  transaction.membership = membership;
  transaction.from = from;
  transaction.to = to;
  transaction.priceWei = priceWei;
  transaction.royaltyPaid = royaltyPaid;
  transaction.timestamp = event.block.timestamp;
  transaction.save();
}

export function handleMembershipMinted(event: MembershipMinted): void {
  const id = membershipId(event.params.tokenId);
  let membership = Membership.load(id);

  if (membership === null) {
    membership = new Membership(id);
  }

  membership.gymAddress = event.params.gymAddress;
  membership.tierId = event.params.tierId;
  membership.owner = event.params.owner;
  membership.user = event.params.owner;
  membership.expiresAt = event.params.expires;
  membership.mintedAt = event.block.timestamp;
  membership.uri = readTokenUri(event);
  membership.currentListing = null;
  membership.save();

  const gym = Gym.load(event.params.gymAddress.toHexString());
  if (gym !== null) {
    gym.totalMinted = gym.totalMinted.plus(BigInt.fromI32(1));
    gym.save();
  }

  saveTransaction(event, "mint", id, zeroAddress(), event.params.owner, null, null);
}

export function handleUpdateUser(event: UpdateUser): void {
  const membership = Membership.load(membershipId(event.params.tokenId));
  if (membership === null) return;

  membership.user = event.params.user.equals(zeroAddress()) ? null : event.params.user;
  membership.expiresAt = event.params.expires;
  membership.save();
}

export function handleMembershipListed(event: MembershipListed): void {
  const id = membershipId(event.params.tokenId);
  const membership = Membership.load(id);
  if (membership === null) return;

  const listing = new Listing(id);
  listing.membership = id;
  listing.seller = event.params.seller;
  listing.priceWei = event.params.priceWei;
  listing.listedAt = event.block.timestamp;
  listing.active = true;
  listing.save();

  membership.currentListing = id;
  membership.save();

  saveTransaction(event, "list", id, event.params.seller, event.address, event.params.priceWei, null);
}

export function handleMembershipSold(event: MembershipSold): void {
  const id = membershipId(event.params.tokenId);
  const membership = Membership.load(id);
  if (membership === null) return;

  const listing = Listing.load(id);
  if (listing !== null) {
    listing.active = false;
    listing.save();
  }

  membership.owner = event.params.buyer;
  membership.user = event.params.buyer;
  membership.currentListing = null;
  membership.save();

  const gym = Gym.load(membership.gymAddress.toHexString());
  if (gym !== null) {
    gym.totalRoyaltyEarned = gym.totalRoyaltyEarned.plus(event.params.royaltyPaid);
    gym.save();
  }

  saveTransaction(
    event,
    "buy",
    id,
    event.params.seller,
    event.params.buyer,
    event.params.priceWei,
    event.params.royaltyPaid
  );
}

export function handleMembershipDelisted(event: MembershipDelisted): void {
  const id = membershipId(event.params.tokenId);
  const listing = Listing.load(id);

  if (listing !== null) {
    listing.active = false;
    listing.save();
  }

  const membership = Membership.load(id);
  if (membership !== null) {
    membership.owner = event.params.seller;
    membership.user = event.params.seller;
    membership.currentListing = null;
    membership.save();
  }

  saveTransaction(event, "delist", id, event.address, event.params.seller, null, null);
}

export function handleGymRegistered(event: GymRegistered): void {
  const id = event.params.gymAddress.toHexString();
  let gym = Gym.load(id);

  if (gym === null) {
    gym = new Gym(id);
    gym.totalMinted = BigInt.fromI32(0);
    gym.totalRoyaltyEarned = BigInt.fromI32(0);
  }

  gym.name = event.params.name;
  gym.treasury = event.params.treasury;
  gym.royaltyBps = readRoyaltyBps(event);
  gym.approved = false;
  gym.save();
}

export function handleGymApproved(event: GymApproved): void {
  const id = event.params.gymAddress.toHexString();
  let gym = Gym.load(id);

  if (gym === null) {
    gym = new Gym(id);
    gym.name = "";
    gym.treasury = zeroAddress();
    gym.royaltyBps = 0;
    gym.totalMinted = BigInt.fromI32(0);
    gym.totalRoyaltyEarned = BigInt.fromI32(0);
  }

  gym.approved = true;
  gym.save();
}
