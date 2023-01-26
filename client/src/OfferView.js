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

fontawesome.library.add(faSpinner, faExchangeAlt, faFileDownload, faCopy);

function OfferList() {
  const [catsLoaded, setCatsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catsLoading, setCatsLoading] = useState(false);
  const [offerData, setOfferData] = useState();
  const { id } = useParams()

  useEffect(() => {
    if (!offerData && !loading) {
      setLoading(true);
      axios.get(`/api/v1/offers/${id}`).then((res) => {
        setOfferData(res.data);
      });
    }
  }, [loading, offerData]);

  useEffect(() => {
    if (!catsLoaded && !catsLoading) {
      setCatsLoading(true);
      axios.get(`/api/v1/cats`).then((res) => {
        setCatData(res.data);
        setCatsLoaded(true);
      });
    }
  }, [loading, offerData]);

  if (!offerData) {
    return (
      <div>
        <FontAwesomeIcon icon="spinner" className="fa-spin" />
      </div>
    );
  } else {
  
    return (
      <div>
        <div className="container">
          <div className="row mb-2">
            <h3>Offer Details</h3>
          </div>
          <div className="row">
            <span className="h4">
              <Trans>Find offers from one coin to another</Trans>
            </span>
          </div>
        </div>
        {!offerData ? (
          <div>
            <FontAwesomeIcon icon="spinner" className="fa-spin" />
          </div>
        ) : (
          <GobyContext.Consumer>
            {({ account }) => (
              <div className="container">
                <div className="row">
                  <div className="pt-1 col-lg-6">
                    <span className="h4">
                      <Trans>Offers</Trans>
                    </span>
                    <div>
                      {offers?.map((offer) => {
                        return printOffer(offer, catData, account);
                      })}
                    </div>
                    {loadingOffers && (
                      <p>
                        <Trans>Loading...</Trans>
                      </p>
                    )}
                    {errorLoadingOffers && (
                      <p>
                        <Trans>Error!</Trans>
                      </p>
                    )}
                    <div/>
                  </div>
                </div>
              </div>
            )}
          </GobyContext.Consumer>
        )}
      </div>
    );
  }
}

const getUnkownCatCode = (cat_id) => {
  return `${t`Unknown`} ${cat_id.slice(0, 5)}...${cat_id.slice(
    cat_id.length - 5
  )}`;
};

const printOffer = (offer, catData, account) => {
  const offered = [];
  const requested = [];
  for (const cat in offer.summary.offered) {
    offered.push({
      amount:
        offer.summary.offered[cat] / (catData[cat]?.mojos_per_coin || 1000),
      code: catData[cat]?.cat_code || getUnkownCatCode(cat),
    });
  }
  for (const cat in offer.summary.requested) {
    requested.push({
      amount:
        offer.summary.requested[cat] / (catData[cat]?.mojos_per_coin || 1000),
      code: catData[cat]?.cat_code || getUnkownCatCode(cat),
    });
  }

  return (
    <div className="card mb-1" style={{ maxWidth: "450px" }} key={offer.offer}>
      <div className="row no-gutters">
        <div className="col-6">
          <div className="card-body pb-0">
            <h6>
              <Trans>Offering</Trans>
            </h6>
            <ul className="list-unstyled">
              {offered.map((r) => {
                return (
                  <li key={`${r.amount}${r.code}`}>
                    {r.amount} {r.code}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="col-6">
          <div className="card-body pb-0">
            <h6>
              <Trans>Requesting</Trans>
            </h6>
            <ul className="list-unstyled">
              {requested.map((r) => {
                return (
                  <li key={`${r.amount}${r.code}`}>
                    {r.amount} {r.code}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      <div className="row no-gutters">
        <div className="col-7">
          {offer.price ? (
            <div className="card-body pt-0">
              <Trans>Price</Trans>: {offer.price}
            </div>
          ) : (
            <div className="card-body pt-0"> </div>
          )}
        </div>
        <div className="col-5">
          <div className="card-body pt-0">
            <h4>
              <TakeOfferInGoby account={account} offer={offer} />
              <CopyToClipboard text={offer.offer}>
                <button
                  className="copy-button btn-link-secondary"
                  title={t`copy offer to clipboard`}
                >
                  <FontAwesomeIcon icon="copy" />
                </button>
              </CopyToClipboard>
              <a
                href={`data:text/plain,${offer.offer}`}
                download={`${offered
                  .map((r) => `${r.amount}${r.code}`)
                  .join("")}x${requested
                  .map((r) => `${r.amount}${r.code}`)
                  .join("")}.offer`}
                className="link-secondary download-button"
                title={t`download offer file`}
              >
                <FontAwesomeIcon icon="file-download" />
              </a>
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

const printInverseOffer = (offer, catData, account) => {
  const offered = [];
  const requested = [];
  for (const cat in offer.summary.offered) {
    offered.push({
      amount:
        offer.summary.offered[cat] / (catData[cat]?.mojos_per_coin || 1000),
      code: catData[cat]?.cat_code || getUnkownCatCode(cat),
    });
  }
  for (const cat in offer.summary.requested) {
    requested.push({
      amount:
        offer.summary.requested[cat] / (catData[cat]?.mojos_per_coin || 1000),
      code: catData[cat]?.cat_code || getUnkownCatCode(cat),
    });
  }
  return (
    <div className="card mb-1" style={{ maxWidth: "450px" }} key={offer.offer}>
      <div className="row no-gutters">
        <div className="col-6">
          <div className="card-body pb-0">
            <h6>
              <Trans>Requesting</Trans>
            </h6>
            <ul className="list-unstyled">
              {requested.map((r) => {
                return (
                  <li key={`${r.amount}${r.code}`}>
                    {r.amount} {r.code}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="col-6">
          <div className="card-body pb-0">
            <h6>
              <Trans>Offering</Trans>
            </h6>
            <ul className="list-unstyled">
              {offered.map((r) => {
                return (
                  <li key={`${r.amount}${r.code}`}>
                    {r.amount} {r.code}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      <div className="row no-gutters">
        <div className="col-7">
          {offer.price ? (
            <div className="card-body pt-0">
              <Trans>Price</Trans>: {offer.price}
            </div>
          ) : (
            <div className="card-body pt-0"> </div>
          )}
        </div>
        <div className="col-5">
          <div className="card-body pt-0">
            <h4>
              <TakeOfferInGoby account={account} offer={offer} />
              <CopyToClipboard text={offer.offer}>
                <button
                  className="copy-button btn-link-secondary"
                  title={t`copy offer to clipboard`}
                >
                  <FontAwesomeIcon icon="copy" />
                </button>
              </CopyToClipboard>
              <a
                href={`data:text/plain,${offer.offer}`}
                download={`${offered
                  .map((r) => `${r.amount}${r.code}`)
                  .join("")}x${requested
                  .map((r) => `${r.amount}${r.code}`)
                  .join("")}.offer`}
                className="link-secondary download-button"
                title={t`download offer file`}
              >
                <FontAwesomeIcon icon="file-download" />
              </a>
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OfferList;
