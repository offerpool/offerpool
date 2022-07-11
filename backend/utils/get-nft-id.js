const { toBech32m } = require("./to-bech32");

const getNftId = (launcher_id) => {
  if(!launcher_id) {
    return undefined;
  }
  return toBech32m(launcher_id, "nft");
}

module.exports.getNftId = getNftId;