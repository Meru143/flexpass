export interface ListingSummary {
  id: string;
  seller: string;
  priceWei: string;
  listedAt: string;
  active: boolean;
}

export interface MembershipSummary {
  id: string;
  gymAddress: string;
  tierId: number;
  owner: string;
  user: string | null;
  expiresAt: string;
  uri: string;
  currentListing?: ListingSummary | null;
}

export interface ListingWithMembership extends ListingSummary {
  membership: MembershipSummary;
}
