import { Prisma } from "@prisma/client";
import { Hono } from "hono";
import { isAddress, type Address } from "viem";

import { prisma } from "../db/client";
import { OnchainConfigError, registerGymOnchain } from "../services/onchain";

interface GymResponse {
  id: string;
  name: string;
  address: string;
  treasury: string;
  royaltyBps: number;
  approved: boolean;
  createdAt: string;
}

interface GymRegisterRequest {
  gymAddress: Address;
  treasury: Address;
  name: string;
  royaltyBps: number;
}

interface GymRegisterResponse {
  gym: GymResponse;
  txHash: string;
}

interface GymListingMembership {
  id: string;
  gymAddress: string;
  tierId: number;
  owner: string;
  user: string | null;
  expiresAt: string;
  uri: string;
}

interface GymListing {
  id: string;
  seller: string;
  priceWei: string;
  listedAt: string;
  active: boolean;
  membership: GymListingMembership;
}

interface GymListingsQueryData {
  listings: GymListing[];
}

interface GraphQLErrorShape {
  message: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLErrorShape[];
}

class SubgraphConfigError extends Error {
  readonly code = "SUBGRAPH_CONFIG_MISSING";
}

const getGymListingsQuery = `
  query GymListings($address: Bytes!) {
    listings(where: { active: true, membership_: { gymAddress: $address } }) {
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

export const gymRoutes = new Hono();

gymRoutes.post("/register", async (c) => {
  const parsedBody = parseGymRegisterBody(await safeJson(c.req));

  if (!parsedBody.ok) {
    return c.json(
      {
        data: null,
        error: {
          code: parsedBody.code,
          message: parsedBody.message,
        },
      },
      400,
    );
  }

  const pendingGym = {
    id: parsedBody.value.gymAddress.toLowerCase(),
    name: parsedBody.value.name,
    address: parsedBody.value.gymAddress.toLowerCase(),
    treasury: parsedBody.value.treasury.toLowerCase(),
    royaltyBps: parsedBody.value.royaltyBps,
    approved: false,
  };

  try {
    const gym = await prisma.gym.create({
      data: pendingGym,
    });

    try {
      const txHash = await registerGymOnchain(parsedBody.value);
      const response: GymRegisterResponse = {
        gym: toGymResponse(gym),
        txHash,
      };

      return c.json({
        data: response,
        error: null,
      });
    } catch (error: unknown) {
      await prisma.gym.delete({ where: { address: pendingGym.address } }).catch(() => undefined);
      throw error;
    }
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return c.json(
        {
          data: null,
          error: {
            code: "GYM_ALREADY_REGISTERED",
            message: "Gym already registered on FlexPass.",
          },
        },
        409,
      );
    }

    if (error instanceof OnchainConfigError) {
      return c.json(
        {
          data: null,
          error: {
            code: error.code,
            message: "Transaction failed — please try again.",
          },
        },
        500,
      );
    }

    return c.json(
      {
        data: null,
        error: {
          code: "GYM_REGISTER_FAILED",
          message: "Transaction failed — please try again.",
        },
      },
      502,
    );
  }
});

gymRoutes.get("/:address/listings", async (c) => {
  const address = c.req.param("address");

  if (!isAddress(address)) {
    return c.json(
      {
        data: null,
        error: {
          code: "INVALID_GYM_ADDRESS",
          message: "This gym is not yet registered on FlexPass.",
        },
      },
      400,
    );
  }

  try {
    const data = await querySubgraph<GymListingsQueryData>(getGymListingsQuery, {
      address: address.toLowerCase(),
    });

    return c.json({
      data: data.listings,
      error: null,
    });
  } catch (error: unknown) {
    if (error instanceof SubgraphConfigError) {
      return c.json(
        {
          data: null,
          error: {
            code: error.code,
            message: "Transaction failed — please try again.",
          },
        },
        500,
      );
    }

    return c.json(
      {
        data: null,
        error: {
          code: "GYM_LISTINGS_FAILED",
          message: "Transaction failed — please try again.",
        },
      },
      502,
    );
  }
});

gymRoutes.get("/:address", async (c) => {
  const address = c.req.param("address");

  if (!isAddress(address)) {
    return c.json(
      {
        data: null,
        error: {
          code: "INVALID_GYM_ADDRESS",
          message: "This gym is not yet registered on FlexPass.",
        },
      },
      400,
    );
  }

  try {
    const gym = await prisma.gym.findFirst({
      where: {
        address: {
          equals: address,
          mode: "insensitive",
        },
      },
    });

    if (!gym) {
      return c.json(
        {
          data: null,
          error: {
            code: "GYM_NOT_FOUND",
            message: "This gym is not yet registered on FlexPass.",
          },
        },
        404,
      );
    }

    return c.json({
      data: toGymResponse(gym),
      error: null,
    });
  } catch (error: unknown) {
    return c.json(
      {
        data: null,
        error: {
          code: "GYM_LOOKUP_FAILED",
          message: "Transaction failed — please try again.",
        },
      },
      500,
    );
  }
});

function toGymResponse(gym: {
  id: string;
  name: string;
  address: string;
  treasury: string;
  royaltyBps: number;
  approved: boolean;
  createdAt: Date;
}): GymResponse {
  return {
    id: gym.id,
    name: gym.name,
    address: gym.address,
    treasury: gym.treasury,
    royaltyBps: gym.royaltyBps,
    approved: gym.approved,
    createdAt: gym.createdAt.toISOString(),
  };
}

async function querySubgraph<TData>(query: string, variables: Record<string, string>): Promise<TData> {
  const subgraphUrl = process.env.SUBGRAPH_URL ?? process.env.NEXT_PUBLIC_SUBGRAPH_URL;

  if (!subgraphUrl) {
    throw new SubgraphConfigError("SUBGRAPH_URL is not configured");
  }

  const response = await fetch(subgraphUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const body = (await response.json()) as GraphQLResponse<TData>;

  if (!response.ok || body.errors?.length || !body.data) {
    throw new Error(body.errors?.[0]?.message ?? `Subgraph query failed with status ${response.status}`);
  }

  return body.data;
}

async function safeJson(request: { json: () => Promise<unknown> }): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function parseGymRegisterBody(body: unknown):
  | { ok: true; value: GymRegisterRequest }
  | { ok: false; code: string; message: string } {
  if (!isRecord(body)) {
    return {
      ok: false,
      code: "INVALID_JSON",
      message: "Transaction failed — please try again.",
    };
  }

  const gymAddress = body.gymAddress;
  const treasury = body.treasury;
  const name = body.name;
  const royaltyBps = body.royaltyBps;

  if (typeof gymAddress !== "string" || !isAddress(gymAddress)) {
    return {
      ok: false,
      code: "INVALID_GYM_ADDRESS",
      message: "This gym is not yet registered on FlexPass.",
    };
  }

  if (typeof treasury !== "string" || !isAddress(treasury)) {
    return {
      ok: false,
      code: "INVALID_TREASURY_ADDRESS",
      message: "Transaction failed — please try again.",
    };
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    return {
      ok: false,
      code: "INVALID_GYM_NAME",
      message: "Transaction failed — please try again.",
    };
  }

  if (typeof royaltyBps !== "number" || !Number.isInteger(royaltyBps) || royaltyBps < 0 || royaltyBps > 3000) {
    return {
      ok: false,
      code: "INVALID_ROYALTY_BPS",
      message: "Transaction failed — please try again.",
    };
  }

  return {
    ok: true,
    value: {
      gymAddress,
      treasury,
      name: name.trim(),
      royaltyBps,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
