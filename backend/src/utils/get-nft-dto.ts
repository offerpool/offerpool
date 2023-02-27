import { getNftCoinInfo } from "./get-offer-summary.js";

export const getNftDTO = (
  launcherId: string,
  nftCoinInfo: Awaited<ReturnType<typeof getNftCoinInfo>>
) => {
  if (!nftCoinInfo.success) {
    return {
      launcher_id: launcherId,
      coin_id: null,
      nft_info: null,
      success: false,
      minter_did_id: null,
      collection_id: null,
    };
  }
  return {
    launcher_id: launcherId,
    coin_id: nftCoinInfo.nft_info.nft_coin_id,
    nft_info: JSON.stringify(nftCoinInfo.nft_info),
    success: nftCoinInfo.success,
    minter_did_id: nftCoinInfo.nft_info.minter_did,
    collection_id: nftCoinInfo.collection_id,
  };
};
