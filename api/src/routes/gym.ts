import { Hono } from "hono";
import { isAddress } from "viem";

import { prisma } from "../db/client";

interface GymResponse {
  id: string;
  name: string;
  address: string;
  treasury: string;
  royaltyBps: number;
  approved: boolean;
  createdAt: string;
}

export const gymRoutes = new Hono();

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
