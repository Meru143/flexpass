import { Hono } from "hono";
import { zeroAddress } from "viem";

import { prisma } from "../db/client";
import { OnchainConfigError, readMembershipState, type MembershipState } from "../services/onchain";

interface MembershipResponse {
  tokenId: string;
  gymAddress: string;
  tierId: number;
  owner: string;
  user: string;
  expiresAt: number;
  metadataUri: string;
  isActive: boolean;
}

const tokenIdPattern = /^[1-9]\d*$/;

export const membershipRoutes = new Hono();

membershipRoutes.get("/:tokenId", async (c) => {
  const tokenId = c.req.param("tokenId");

  if (!tokenIdPattern.test(tokenId)) {
    return c.json(
      {
        data: null,
        error: {
          code: "INVALID_TOKEN_ID",
          message: "Token ID must be a positive integer.",
        },
      },
      400,
    );
  }

  try {
    const cachedMembership = await prisma.membershipCache.findUnique({
      where: { tokenId },
    });

    if (cachedMembership) {
      return c.json({
        data: toResponse({
          tokenId: cachedMembership.tokenId,
          gymAddress: cachedMembership.gymAddress,
          tierId: cachedMembership.tierId,
          ownerAddress: cachedMembership.ownerAddress,
          userAddress: cachedMembership.userAddress,
          expiresAt: cachedMembership.expiresAt,
          metadataUri: cachedMembership.metadataUri,
        }),
        error: null,
      });
    }

    const chainState = await readMembershipState(BigInt(tokenId));
    const cachedState = await cacheMembershipState(tokenId, chainState);

    return c.json({
      data: toResponse(cachedState),
      error: null,
    });
  } catch (error: unknown) {
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
          code: "MEMBERSHIP_LOOKUP_FAILED",
          message: "Transaction failed — please try again.",
        },
      },
      502,
    );
  }
});

async function cacheMembershipState(tokenId: string, state: MembershipState) {
  return prisma.membershipCache.upsert({
    where: { tokenId },
    create: {
      id: tokenId,
      tokenId,
      gymAddress: state.gymAddress,
      tierId: state.tierId,
      ownerAddress: state.owner,
      userAddress: state.user,
      expiresAt: new Date(Number(state.expiresAt) * 1000),
      metadataUri: state.metadataUri,
    },
    update: {
      gymAddress: state.gymAddress,
      tierId: state.tierId,
      ownerAddress: state.owner,
      userAddress: state.user,
      expiresAt: new Date(Number(state.expiresAt) * 1000),
      metadataUri: state.metadataUri,
    },
  });
}

function toResponse(record: {
  tokenId: string;
  gymAddress: string;
  tierId: number;
  ownerAddress: string;
  userAddress: string;
  expiresAt: Date;
  metadataUri: string;
}): MembershipResponse {
  const expiresAt = Math.floor(record.expiresAt.getTime() / 1000);

  return {
    tokenId: record.tokenId,
    gymAddress: record.gymAddress,
    tierId: record.tierId,
    owner: record.ownerAddress,
    user: record.userAddress,
    expiresAt,
    metadataUri: record.metadataUri,
    isActive: record.userAddress !== zeroAddress && expiresAt >= Math.floor(Date.now() / 1000),
  };
}
