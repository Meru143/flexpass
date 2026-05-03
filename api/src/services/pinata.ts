import { PinataSDK, type GetCIDResponse } from "pinata";

export class PinataConfigError extends Error {
  readonly code = "PINATA_CONFIG_MISSING";
}

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
});

export async function uploadMetadata(metadata: object): Promise<string> {
  if (!process.env.PINATA_JWT) {
    throw new PinataConfigError("PINATA_JWT is not configured");
  }

  const upload = await pinata.upload.public.json(metadata);

  return `ipfs://${upload.cid}`;
}

export async function getMetadata(cid: string): Promise<object> {
  if (cid.trim().length === 0) {
    throw new PinataConfigError("CID is required");
  }

  const response: GetCIDResponse = await pinata.gateways.public.get(cid);

  if (!isObjectMetadata(response.data)) {
    throw new Error("Pinata gateway returned non-object metadata");
  }

  return response.data;
}

function isObjectMetadata(value: unknown): value is object {
  return typeof value === "object" && value !== null && !(value instanceof Blob) && !Array.isArray(value);
}
