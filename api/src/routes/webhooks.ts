import { createHmac, timingSafeEqual } from "node:crypto";

import { Hono } from "hono";
import { isAddress } from "viem";

import { prisma } from "../db/client";

interface GymEntryPayload {
  tokenId: string;
  gymAddress: string;
  walletAddress: string;
  timestamp: number;
}

class WebhookConfigError extends Error {
  readonly code = "WEBHOOK_CONFIG_MISSING";
}

const tokenIdPattern = /^[1-9]\d*$/;

export const webhookRoutes = new Hono();

webhookRoutes.post("/gym-entry", async (c) => {
  try {
    const rawBody = await c.req.text();
    const signature = c.req.header("X-FlexPass-Signature");

    if (!isValidSignature(rawBody, signature)) {
      return c.json(
        {
          data: null,
          error: {
            code: "INVALID_WEBHOOK_SIGNATURE",
            message: "Transaction failed — please try again.",
          },
        },
        401,
      );
    }

    const parsedPayload = parseGymEntryPayload(parseJson(rawBody));

    if (!parsedPayload.ok) {
      return c.json(
        {
          data: null,
          error: {
            code: parsedPayload.code,
            message: parsedPayload.message,
          },
        },
        400,
      );
    }

    await prisma.entryEvent.create({
      data: {
        tokenId: parsedPayload.value.tokenId,
        gymAddress: parsedPayload.value.gymAddress.toLowerCase(),
        walletAddress: parsedPayload.value.walletAddress.toLowerCase(),
        enteredAt: timestampToDate(parsedPayload.value.timestamp),
      },
    });

    return c.json({
      data: { ok: true },
      error: null,
    });
  } catch (error: unknown) {
    if (error instanceof WebhookConfigError) {
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
          code: "GYM_ENTRY_WEBHOOK_FAILED",
          message: "Transaction failed — please try again.",
        },
      },
      500,
    );
  }
});

function isValidSignature(rawBody: string, providedSignature: string | undefined): boolean {
  const secret = process.env.WEBHOOK_HMAC_SECRET;

  if (!secret) {
    throw new WebhookConfigError("WEBHOOK_HMAC_SECRET is not configured");
  }

  if (!providedSignature) {
    return false;
  }

  const normalizedSignature = providedSignature.replace(/^sha256=/i, "");

  if (!/^[0-9a-fA-F]{64}$/.test(normalizedSignature)) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const providedBuffer = Buffer.from(normalizedSignature, "hex");

  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

function parseJson(rawBody: string): unknown {
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

function parseGymEntryPayload(body: unknown):
  | { ok: true; value: GymEntryPayload }
  | { ok: false; code: string; message: string } {
  if (!isRecord(body)) {
    return invalidPayload("INVALID_JSON");
  }

  const tokenId = body.tokenId;
  const gymAddress = body.gymAddress;
  const walletAddress = body.walletAddress;
  const timestamp = body.timestamp;

  if (typeof tokenId !== "string" || !tokenIdPattern.test(tokenId)) {
    return invalidPayload("INVALID_TOKEN_ID");
  }

  if (typeof gymAddress !== "string" || !isAddress(gymAddress)) {
    return invalidPayload("INVALID_GYM_ADDRESS");
  }

  if (typeof walletAddress !== "string" || !isAddress(walletAddress)) {
    return invalidPayload("INVALID_WALLET_ADDRESS");
  }

  if (typeof timestamp !== "number" || !Number.isInteger(timestamp) || timestamp <= 0) {
    return invalidPayload("INVALID_TIMESTAMP");
  }

  return {
    ok: true,
    value: {
      tokenId,
      gymAddress,
      walletAddress,
      timestamp,
    },
  };
}

function timestampToDate(timestamp: number): Date {
  return new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
}

function invalidPayload(code: string): { ok: false; code: string; message: string } {
  return {
    ok: false,
    code,
    message: "Transaction failed — please try again.",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
