import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import { MembershipMinted } from "../generated/GymMembership/GymMembership"

export function createMembershipMintedEvent(
  tokenId: BigInt,
  gymAddress: Address,
  tierId: i32,
  owner: Address,
  expires: BigInt
): MembershipMinted {
  let membershipMintedEvent = changetype<MembershipMinted>(newMockEvent())

  membershipMintedEvent.parameters = new Array()

  membershipMintedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  membershipMintedEvent.parameters.push(
    new ethereum.EventParam(
      "gymAddress",
      ethereum.Value.fromAddress(gymAddress)
    )
  )
  membershipMintedEvent.parameters.push(
    new ethereum.EventParam(
      "tierId",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tierId))
    )
  )
  membershipMintedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  membershipMintedEvent.parameters.push(
    new ethereum.EventParam(
      "expires",
      ethereum.Value.fromUnsignedBigInt(expires)
    )
  )

  return membershipMintedEvent
}
