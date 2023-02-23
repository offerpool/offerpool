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
import { GobyContext } from "./contexts/GobyContext";
import { TakeOfferInGoby } from "./components/TakeOfferInGoby";
import { toBech32m } from "./utils/bech32";

import type { ResultType } from "../../backend/src/routes/v1/offers/[id]/types.js";

fontawesome.library.add(
  faSpinner as any,
  faExchangeAlt as any,
  faFileDownload as any,
  faCopy as any
);

function OfferView() {
  const [loading, setLoading] = useState(false);
  const [offerData, setOfferData] = useState<ResultType>();
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
  }, [loading, offerData, id]);

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
              {offerData.info.requested.map((tradeItem) => TradeItem(tradeItem))}
            </div>
          </div>
          <div>
            <div style={headerStyle}>Offering</div>
            <div>
              {offerData.info.offered.map((tradeItem) => TradeItem(tradeItem))}
            </div>
          </div>
          <div>
            <div style={headerStyle}>Offer</div>
            <div className="card-body pt-0">
              <h4>
                <GobyContext.Consumer>
                  {({ account }) => (
                    <TakeOfferInGoby account={account} offer={offerData} />
                  )}
                </GobyContext.Consumer>
                <CopyToClipboard text={offerData.offer}>
                  <button
                    className="copy-button btn-link-secondary"
                    title={t`copy offer to clipboard`}
                  >
                    <FontAwesomeIcon icon="copy" />
                  </button>
                </CopyToClipboard>
                <a
                  href={`data:text/plain,${offerData.offer}`}
                  download={`${id}.offer`}
                  className="link-secondary download-button"
                  title={t`download offer file`}
                >
                  <FontAwesomeIcon icon="file-download" />
                </a>
              </h4>
            </div>
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

function TradeItem(tradeItem: ResultType["info"]["offered"][0]) {
  if (tradeItem.component_type === "nft") {
    return NFT(tradeItem);
  }
  const amount = tradeItem.amount / (tradeItem.mojos_per_coin || 1000);
  const code = tradeItem?.cat_code || getUnkownCatCode(tradeItem.component_id);
  return (
    <div key={tradeItem.component_id}>
      {amount} {code}
    </div>
  );
}

function NFT(tradeItem: ResultType["info"]["offered"][0]) {
  if (tradeItem.component_type !== "nft") {
    return <></>;
  }
  let nftId = tradeItem?.nft_info?.launcher_id;
  if(tradeItem?.nft_info?.launcher_id) {
    nftId = toBech32m(tradeItem.nft_info.launcher_id, "nft");
  }
  return (
    <div key={tradeItem.component_id}>
      <div>
        <a href={`https://www.spacescan.io/nft/${nftId}`}>
          {nftId}
        </a>
      </div>
      <img
        src={tradeItem?.nft_info?.data_uris?.[0]}
        alt="NFT"
        style={{ maxWidth: "400px", maxHeight: "400px" }}
      ></img>
    </div>
  );
}

const getUnkownCatCode = (cat_id: string) => {
  return `${t`Unknown`} ${cat_id.slice(0, 5)}...${cat_id.slice(
    cat_id.length - 5
  )}`;
};

export default OfferView;
