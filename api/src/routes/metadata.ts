import { Hono } from "hono";

import { PinataConfigError, uploadMetadata } from "../services/pinata";

interface MetadataUploadRequest {
  gymName: string;
  tier: string;
  amenities: string[];
  expiresAt: number;
  logoUrl: string;
}

interface MetadataAttribute {
  trait_type: string;
  value: string | number;
}

interface FlexPassMetadata {
  name: string;
  description: string;
  image: string;
  attributes: MetadataAttribute[];
}

export const metadataRoutes = new Hono();

metadataRoutes.post("/upload", async (c) => {
  const parsedBody = parseMetadataUploadBody(await safeJson(c.req));

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

  try {
    const tokenUri = await uploadMetadata(buildMetadata(parsedBody.value));

    return c.json({
      data: { tokenUri },
      error: null,
    });
  } catch (error: unknown) {
    if (error instanceof PinataConfigError) {
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
          code: "METADATA_UPLOAD_FAILED",
          message: "Transaction failed — please try again.",
        },
      },
      502,
    );
  }
});

function buildMetadata(body: MetadataUploadRequest): FlexPassMetadata {
  return {
    name: `${body.gymName} ${body.tier} FlexPass`,
    description: `Time-bound FlexPass membership for ${body.gymName}.`,
    image: body.logoUrl,
    attributes: [
      { trait_type: "Gym", value: body.gymName },
      { trait_type: "Tier", value: body.tier },
      { trait_type: "Expires At", value: body.expiresAt },
      { trait_type: "Amenities", value: body.amenities.join(", ") },
    ],
  };
}

async function safeJson(request: { json: () => Promise<unknown> }): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function parseMetadataUploadBody(body: unknown):
  | { ok: true; value: MetadataUploadRequest }
  | { ok: false; code: string; message: string } {
  if (!isRecord(body)) {
    return invalidBody("INVALID_JSON");
  }

  const gymName = body.gymName;
  const tier = body.tier;
  const amenities = body.amenities;
  const expiresAt = body.expiresAt;
  const logoUrl = body.logoUrl;

  if (typeof gymName !== "string" || gymName.trim().length === 0) {
    return invalidBody("INVALID_GYM_NAME");
  }

  if (typeof tier !== "string" || tier.trim().length === 0) {
    return invalidBody("INVALID_TIER");
  }

  if (!Array.isArray(amenities) || !amenities.every((amenity) => typeof amenity === "string")) {
    return invalidBody("INVALID_AMENITIES");
  }

  if (typeof expiresAt !== "number" || !Number.isInteger(expiresAt) || expiresAt <= 0) {
    return invalidBody("INVALID_EXPIRES_AT");
  }

  if (typeof logoUrl !== "string" || logoUrl.trim().length === 0) {
    return invalidBody("INVALID_LOGO_URL");
  }

  return {
    ok: true,
    value: {
      gymName: gymName.trim(),
      tier: tier.trim(),
      amenities: amenities.map((amenity) => amenity.trim()).filter(Boolean),
      expiresAt,
      logoUrl: logoUrl.trim(),
    },
  };
}

function invalidBody(code: string): { ok: false; code: string; message: string } {
  return {
    ok: false,
    code,
    message: "Transaction failed — please try again.",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
