const { getNftId } = require("../../utils/get-nft-id");

const mapNftInfo = (nftInfo) => {
    if(!nftInfo?.length) {
      return undefined;
    }
    for(const nft of nftInfo) {
      nft.nft_id = getNftId(nft?.nft_launcher_id);
    }
    return nftInfo;
  }

const mapMinNftInfo = (nftInfo) => {
  if(!nftInfo?.length) {
    return undefined;
  }
  for(const nft of nftInfo) {
    nft.nft_id = getNftId(nft?.nft_launcher_id);
  }
  return nftInfo.map((nft) => {
    return {
      nft_id: getNftId(nft?.nft_launcher_id),
      launcher_id: nft?.nft_launcher_id,
    }
  });
}

module.exports.mapNftInfo = mapNftInfo;
module.exports.mapMinNftInfo = mapMinNftInfo;