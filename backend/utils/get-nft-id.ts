import { toBech32m } from "./to-bech32.js";

export const getNftId = (launcher_id: string) => {
  if (!launcher_id) {
    return undefined;
  }
  return toBech32m(launcher_id, "nft");
};
