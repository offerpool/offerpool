import crypto from "crypto";
import { logger } from "./logger.js";
import { RPCAgent } from "chia-agent";
import {
  check_offer_validity,
  get_offer_summary,
  nft_get_info,
} from "chia-agent/api/rpc/wallet/index.js";
import { NFTInfo } from "chia-agent/api/chia/wallet/nft_wallet/nft_info.js";
const agent = new RPCAgent({
  service: "wallet",
});

export const getOfferSummary = async (offer: string) => {
  return await get_offer_summary(agent, { offer });
};

export const getOfferValidity = async (offer: string) => {
  return await check_offer_validity(agent, { offer });
};

export const getNftCoinInfo = async (coin_id: string) => {
  const info = await nft_get_info(agent, { coin_id });
  if (!info.success) {
    return info;
  }

  const metadataResult = await getNFTMetadata(info.nft_info);

  const result: Omit<typeof info, "success"> & {
    success: boolean;
    collection_id?: string;
  } = { ...info };

  result.success = metadataResult.success;
  if (!result.success) {
    return result;
  }
  result.collection_id = metadataResult.metadata?.collection?.id;
  if (!result.success) {
    return result;
  }
  return result;
};

export const getNFTMetadata = async (nft_info: NFTInfo) => {
  // If there is no metadata, consider it successful
  let success = true;
  for (let i = 0; i < nft_info?.metadata_uris?.length ?? 0; i++) {
    success = false;
    try {
      const response = await fetch(nft_info.metadata_uris[i]);
      const responseString = await response.text();
      const hash = "0x" +
        crypto.createHash("sha256").update(responseString).digest("hex");
      if (response.status < 300) {
        if (!nft_info.metadata_hash || hash == nft_info.metadata_hash) {
          return {
            success: true,
            metadata: JSON.parse(responseString),
          };
        }
      }
      logger.silent(
        {
          expected_hash: nft_info?.metadata_hash,
          actual_hash: hash,
          response: responseString,
        },
        "error getting nft metadata",
      );
    } catch (e) {
      logger.info({ e }, "thrown error getting nft metadata");
      // Don't log any errors here
    }
  }
  return {
    success,
  };
};
