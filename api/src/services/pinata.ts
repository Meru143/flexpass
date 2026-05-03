import { PinataSDK } from "pinata";

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
