import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { encodeBuffer } from "./to-bech32.js";
import { getNftDTO } from "./get-nft-dto.js";
const prisma = new PrismaClient();

export async function saveNFTInfos(nftInfos: ReturnType<typeof getNftDTO>[]) {
  for (let nftInfo of nftInfos) {
    const updateInput = {
      coin_id: nftInfo.coin_id || undefined,
      info: nftInfo.nft_info || undefined,
      info_version: nftInfo.success ? 1 : 0,
      minter_did_id: nftInfo.minter_did_id || undefined,
      collection_id: nftInfo.collection_id || undefined,
      col_id: getColId(
        nftInfo.minter_did_id || "",
        nftInfo.collection_id || ""
      ), // TODO: Hash collection_id and minter_did_id
    };
    await prisma.nftInfo.upsert({
      where: {
        launcher_id: nftInfo.launcher_id,
      },
      update: updateInput,
      create: {
        launcher_id: nftInfo.launcher_id,
        ...updateInput,
      },
    });
  }
  return;
}
function getColId(minter_did_id: string, collection_id: string) {
  if (collection_id && minter_did_id) {
    const hashBuffer = createHash("sha256")
      .update(`${minter_did_id}${collection_id}`)
      .digest();
    return encodeBuffer("col", hashBuffer);
  }
  return undefined;
}
