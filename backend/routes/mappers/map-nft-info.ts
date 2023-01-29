import { getNftId } from "../../utils/get-nft-id.js";

export const mapNftInfo = (nftInfo: any) => {
  if (!nftInfo?.length) {
    return undefined;
  }
  for (const nft of nftInfo) {
    nft.nft_id = getNftId(nft?.nft_launcher_id);
  }
  return nftInfo;
};

export const mapMinNftInfo = (nftInfo: any) => {
  if (!nftInfo?.length) {
    return undefined;
  }
  for (const nft of nftInfo) {
    nft.nft_id = getNftId(nft?.nft_launcher_id);
  }
  return nftInfo.map((nft: any) => {
    return {
      nft_id: getNftId(nft?.nft_launcher_id),
      launcher_id: nft?.nft_launcher_id,
    };
  });
};
