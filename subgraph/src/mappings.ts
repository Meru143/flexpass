import { MembershipMinted } from "../generated/GymMembership/GymMembership";
import { Membership } from "../generated/schema";

export function handleMembershipMinted(event: MembershipMinted): void {
  const membership = new Membership(event.params.tokenId.toString());

  membership.save();
}
