export const getNftDTO = (nftCoinId: string, nftCoinInfo: any) => {
  return {
    coin_id: nftCoinId,
    nft_info: nftCoinInfo.nft_info,
    success: nftCoinInfo.success,
    minter_did_id: nftCoinInfo.minter_did_id,
    collection_id: nftCoinInfo.collection_id,
  };
};
