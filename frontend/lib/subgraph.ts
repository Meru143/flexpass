interface GraphQLErrorShape {
  message: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLErrorShape[];
}

export async function querySubgraph<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

  if (!subgraphUrl) {
    throw new Error("NEXT_PUBLIC_SUBGRAPH_URL is not configured");
  }

  const response = await fetch(subgraphUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: variables ?? {},
    }),
  });

  const body = (await response.json()) as GraphQLResponse<TData>;

  if (!response.ok || body.errors?.length || !body.data) {
    throw new Error(body.errors?.[0]?.message ?? `Subgraph query failed with status ${response.status}`);
  }

  return body.data;
}

export const GET_USER_MEMBERSHIPS = `
  query UserMemberships($owner: Bytes!) {
    memberships(where: { owner: $owner }) {
      id
      gymAddress
      tierId
      owner
      user
      expiresAt
      uri
      currentListing {
        id
        seller
        priceWei
        listedAt
        active
      }
    }
  }
`;

export const GET_ACTIVE_LISTINGS = `
  query ActiveListings {
    listings(where: { active: true }) {
      id
      seller
      priceWei
      listedAt
      active
      membership {
        id
        gymAddress
        tierId
        owner
        user
        expiresAt
        uri
      }
    }
  }
`;

export const GET_LISTING_BY_TOKEN_ID = `
  query ListingByTokenId($tokenId: ID!) {
    listing(id: $tokenId) {
      id
      seller
      priceWei
      listedAt
      active
      membership {
        id
        gymAddress
        tierId
        owner
        user
        expiresAt
        uri
      }
    }
  }
`;
