import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import fontawesome from "@fortawesome/fontawesome";
import {
  faSpinner,
  faExchangeAlt,
  faFileDownload,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Trans, t } from "@lingui/macro";
import { ThemeContext } from "./contexts/ThemeContext";
import { GobyContext } from "./contexts/GobyContext";
import { TakeOfferInGoby } from "./components/TakeOfferInGoby";

fontawesome.library.add(
  faSpinner as any,
  faExchangeAlt as any,
  faFileDownload as any,
  faCopy as any
);

export interface OfferInfo {
  offer: string;
  active: boolean;
  summary_with_cat_info: SummaryWithCatInfo;
  nft_info: NftInfo[];
}

export interface SummaryWithCatInfo {
  offered: ReqInfo[];
  requested: ReqInfo[];
}

export interface ReqInfo {
  cat_id: string;
  cat_code: string;
  cat_name: string;
  mojos_per_coin: number;
  amount: number;
  nft?: {
    nft_launcher_id: string;
    nft_info: NFTInfoParsed;
    nft_id: string;
  };
}

export interface NftInfo {
  nft_launcher_id: string;
  nft_info: string;
  nft_id: string;
}

export interface NFTInfoParsed {
  chain_info: string;
  data_hash: string;
  data_uris: string[];
  edition_number: number;
  edition_total: number;
  launcher_id: string;
  launcher_puzhash: string;
  license_hash: string;
  license_uris: string[];
  metadata_hash: string;
  metadata_uris: string[];
  mint_height: number;
  minter_did: string;
  nft_coin_id: string;
  off_chain_metadata: any;
  owner_did: any;
  p2_address: string;
  pending_transaction: boolean;
  royalty_percentage: number;
  royalty_puzzle_hash: string;
  supports_did: boolean;
  updater_puzhash: string;
}

function OfferView() {
  const [loading, setLoading] = useState(false);
  const [offerData, setOfferData] = useState<OfferInfo>();
  const [error, setError] = useState<any>();
  const { id } = useParams();

  useEffect(() => {
    if (!offerData && !loading) {
      setLoading(true);
      axios
        .get(`/api/v1/offers/${id}`)
        .then((res) => {
          setOfferData(res.data);
        })
        .catch((err) => {
          setError(err);
        });
    }
  }, [loading, offerData]);

  if (!offerData && !error) {
    return (
      <div>
        <FontAwesomeIcon icon="spinner" className="fa-spin" />
      </div>
    );
  } else if (error || !offerData) {
    return (
      <div>
        <div>Error</div>
        {error?.message}
      </div>
    );
  } else {
    const headerStyle = { fontWeight: "bold" };
    return (
      <div>
        <div className="container">
          <div className="row mb-2">
            <h3>
              <Trans>Offer Details</Trans>
            </h3>
          </div>
          <div>
            <div style={headerStyle}>Status</div>
            <div>{offerData.active ? "Active" : "No longer available"}</div>
          </div>
          <div>
            <div style={headerStyle}>Requesting</div>
            <div>
              {populateInNFTInfo(
                offerData.summary_with_cat_info.requested,
                offerData.nft_info
              ).map((tradeItem) => TradeItem(tradeItem))}
            </div>
          </div>
          <div>
            <div style={headerStyle}>Offering</div>
            <div>
              {populateInNFTInfo(
                offerData.summary_with_cat_info.offered,
                offerData.nft_info
              ).map((tradeItem) => TradeItem(tradeItem))}
            </div>
          </div>
          <div>
            <div style={headerStyle}>Offer</div>
            <div
              style={{
                fontSize: "8px",
                lineHeight: "1rem",
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                wordWrap: "break-word",
              }}
            >
              {offerData.offer}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function TradeItem(tradeItem: ReqInfo) {
  if (tradeItem.nft) {
    return NFT(tradeItem);
  }
  const amount = tradeItem.amount / (tradeItem.mojos_per_coin || 1000);
  const code = tradeItem?.cat_code || getUnkownCatCode(tradeItem.cat_id);
  return (
    <div>
      {amount} {code}
    </div>
  );
}

function NFT(tradeItem: ReqInfo) {
  if (!tradeItem.nft) {
    return <></>;
  }
  return (
    <div>
      <div>
        <a href={`https://www.spacescan.io/nft/${tradeItem.nft.nft_id}`}>
          {tradeItem.nft.nft_id}
        </a>
      </div>
      <img
        src={tradeItem.nft.nft_info.data_uris[0]}
        style={{ maxWidth: "400px", maxHeight: "400px" }}
      ></img>
    </div>
  );
}

function populateInNFTInfo(reqInfos: ReqInfo[], nftInfos: NftInfo[]) {
  for (const info of reqInfos) {
    const nft = nftInfos.find((nft) => nft.nft_launcher_id === info.cat_id);
    if (nft) {
      info.nft = {
        nft_info: JSON.parse(nft.nft_info),
        nft_launcher_id: nft.nft_launcher_id,
        nft_id: nft.nft_id,
      };
    }
  }
  return reqInfos;
}

const getUnkownCatCode = (cat_id: string) => {
  return `${t`Unknown`} ${cat_id.slice(0, 5)}...${cat_id.slice(
    cat_id.length - 5
  )}`;
};

export default OfferView;
