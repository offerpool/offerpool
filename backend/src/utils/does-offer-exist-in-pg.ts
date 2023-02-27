import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

/** Given an array of offers, return true or false if they exist in the database */
export const doesOfferExistInPG = async (offers: string[]) => {
  if (!offers || offers.length < 1) {
    return [];
  }

  const offerHashes = offers.map((offer) => {
    return crypto.createHash("sha256").update(offer).digest();
  });

  const results = await prisma.offer.findMany({
    where: {
      id: { in: offerHashes },
    },
    select: {
      id: true,
    },
  });

  const offerHashesBase64 = offerHashes.map((h) => h.toString("base64"));

  // turn the row hashes into a map
  const existingHashes: Record<string, boolean> = {};

  for (let i = 0; i < results.length; i++) {
    existingHashes[results[i].id.toString("base64")] = true;
  }

  const returnArray = [];
  for (let i = 0; i < offers.length; i++) {
    returnArray.push(existingHashes[offerHashesBase64[i]] || false);
  }
  return returnArray;
};
