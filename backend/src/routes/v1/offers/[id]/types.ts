import { NFTInfo } from "chia-agent/api/chia/wallet/nft_wallet/nft_info.js";

export interface ResultType {
  id: string;
  active: boolean;
  offer: string;
  info: {
    offered: ReturnComponentInfo[];
    requested: ReturnComponentInfo[];
  };
}

export interface ReturnComponentInfo {
  component_type: "nft" | "cat";
  component_id: string;
  cat_code?: string;
  cat_name?: string;
  mojos_per_coin: number;
  amount: number;
  nft_info?: NFTInfo;
}
