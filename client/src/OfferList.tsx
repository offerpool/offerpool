import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import fontawesome from "@fortawesome/fontawesome";
import {
  faSpinner,
  faExchangeAlt,
  faFileDownload,
  faCopy,
  faInfo,
} from "@fortawesome/free-solid-svg-icons";
import { useLoadOffers } from "./hooks/useLoadOffers";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { useDropzone } from "react-dropzone";
import { useLoadInverseOffers } from "./hooks/useLoadInverseOffers";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Trans, t } from "@lingui/macro";
import { ThemeContext } from "./contexts/ThemeContext";
import { GobyContext } from "./contexts/GobyContext";
import { TakeOfferInGoby } from "./components/TakeOfferInGoby";
import { CatInfo } from "./hooks/CatInfo";
import type { ResultType } from "../../backend/src/routes/v1/offers/types.js"

fontawesome.library.add(
  faSpinner as any,
  faExchangeAlt as any,
  faFileDownload as any,
  faCopy as any,
  faInfo as any
);

function OfferList() {
  // Get the cats available
  const [offersLoaded, setOffersLoaded] = useState(false);
  const [catsLoaded, setCatsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catData, setCatData] = useState<any>();
  const [fromCat, setFromCat] = useState<CatInfo>();
  const [toCat, setToCat] = useState<CatInfo>();
  const [isUploadResultOpen, setIsUploadResultOpen] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>();
  const navigate = useNavigate();

  const {
    loadingOffers,
    offers,
    hasNextOffersPage,
    errorLoadingOffers,
    loadMoreOffers,
    clearOfferState,
  } = useLoadOffers(fromCat, toCat);

  const {
    loadingInverseOffers,
    inverseOffers,
    hasNextInverseOffersPage,
    errorLoadingInverseOffers,
    loadMoreInverseOffers,
    clearInverseOfferState,
  } = useLoadInverseOffers(fromCat, toCat);

  const [infiniteRefOffers] = useInfiniteScroll({
    loading: loadingOffers,
    hasNextPage: hasNextOffersPage,
    onLoadMore: loadMoreOffers,
    // When there is an error, we stop infinite loading.
    // It can be reactivated by setting "error" state as undefined.
    disabled: !!errorLoadingOffers,
    // `rootMargin` is passed to `IntersectionObserver`.
    // We can use it to trigger 'onLoadMore' when the sentry comes near to become
    // visible, instead of becoming fully visible on the screen.
    rootMargin: "0px 0px 400px 0px",
  });

  const [infiniteRefInverseOffers] = useInfiniteScroll({
    loading: loadingInverseOffers,
    hasNextPage: hasNextInverseOffersPage,
    onLoadMore: loadMoreInverseOffers,
    // When there is an error, we stop infinite loading.
    // It can be reactivated by setting "error" state as undefined.
    disabled: !!errorLoadingInverseOffers,
    // `rootMargin` is passed to `IntersectionObserver`.
    // We can use it to trigger 'onLoadMore' when the sentry comes near to become
    // visible, instead of becoming fully visible on the screen.
    rootMargin: "0px 0px 400px 0px",
  });

  useEffect(() => {
    if (!catData && !loading) {
      setLoading(true);
      axios.get("/api/v1/cats").then((res) => {
        // Read from the params to see if there is a value, otherwise assume it's an id, otherwise default in USDS / XCH
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const from = urlParams.get("from");
        const to = urlParams.get("to");
        // turn the cats into an array
        const catsArray = [];
        for (let id in res.data) {
          catsArray.push(res.data[id]);
        }

        let fromCat =
          res.data[
            "6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589"
          ];
        let toCat = res.data["xch"];
        if (to || from) {
          fromCat = { id: "any" };
          toCat = { id: "any" };
        }
        if (to && catsArray.find((cat) => cat.cat_code === to.toUpperCase())) {
          toCat = catsArray.find((cat) => cat.cat_code === to.toUpperCase());
        }
        if (
          from &&
          catsArray.find((cat) => cat.cat_code === from.toUpperCase())
        ) {
          fromCat = catsArray.find(
            (cat) => cat.cat_code === from.toUpperCase()
          );
        }
        setToCat(toCat);
        setFromCat(fromCat);
        setCatData(res.data);
        setCatsLoaded(true);
      });
    }
  }, [loading, catData]);

  useEffect(() => {
    setOffersLoaded(offers !== undefined && inverseOffers !== undefined);
  }, [offers, inverseOffers]);

  const onchangeSelectFrom = (item: any) => {
    let newFromCat: CatInfo = { id: "any", mojos_per_coin: NaN };
    if (item.value !== "any") {
      newFromCat = catData[item.value];
    }
    setFromCat(newFromCat);
    clearOfferState();
    clearInverseOfferState();
    setCatsInHistory(newFromCat, toCat);
  };

  const onchangeSelectTo = (item: any) => {
    let newToCat = { id: "any", mojos_per_coin: NaN };
    if (item.value !== "any") {
      newToCat = catData[item.value];
    }
    setToCat(newToCat);
    clearOfferState();
    clearInverseOfferState();
    setCatsInHistory(fromCat, newToCat);
  };

  const onInvertCats = () => {
    const tempToCat = fromCat;
    const tempFromCat = toCat;
    setToCat(tempToCat);
    setFromCat(tempFromCat);
    clearOfferState();
    clearInverseOfferState();
    setCatsInHistory(tempFromCat, tempToCat);
  };

  const setCatsInHistory = (
    fromCat: CatInfo | undefined,
    toCat: CatInfo | undefined
  ) => {
    // If they are both any, save that
    const fromCatString = (
      fromCat?.cat_code ??
      fromCat?.id ??
      ""
    ).toLowerCase();
    const toCatString = (toCat?.cat_code ?? toCat?.id ?? "").toLowerCase();
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const language = urlParams.get("lang");
    let langParam = language ? `&lang=${language}` : "";

    if (fromCat?.id === "any" && toCat?.id === "any") {
      navigate(`/?from=${fromCatString}&to=${toCatString}${langParam}`, {
        replace: true,
      });
    } else if (fromCat?.id === "any") {
      // If one is any, don't include it
      navigate(`/?to=${toCatString}${langParam}`, { replace: true });
    } else if (toCat?.id === "any") {
      navigate(`/?from=${fromCatString}${langParam}`, { replace: true });
    } else {
      // Include both if neither are any
      navigate(`/?from=${fromCatString}&to=${toCatString}${langParam}`, {
        replace: true,
      });
    }
  };

  function readFile(file: Blob) {
    return new Promise((resolve, reject) => {
      var fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.onerror = reject;
      fr.readAsText(file);
    });
  }

  const onDrop = useCallback(async (files: Blob[]) => {
    // loop through the files and make sure they are valid offers, upload them to the api, an then list the results per filename
    const readPromises = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      readPromises.push(readFile(file));
    }
    const readResults = await Promise.all(readPromises);
    const results = [];
    for (let i = 0; i < readResults.length; i++) {
      const offer = readResults[i] as string;
      if (!offer.startsWith("offer")) {
        results.push(t`Error adding offer, Invalid offer file`);
        continue;
      }
      try {
        await axios.post("/api/v1/offers", { offer });
        results.push(t`Success`);
      } catch (err: any) {
        if (err?.response?.data?.error_message) {
          results.push(
            `${t`Error adding offer`}: ${err?.response?.data?.error_message}`
          );
        } else {
          results.push(t`Error adding offer, try again later`);
        }
      }
    }
    setUploadResults({
      files,
      results,
    });
    setIsUploadResultOpen(true);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  if (!catsLoaded) {
    return (
      <div>
        <FontAwesomeIcon icon="spinner" className="fa-spin" />
      </div>
    );
  } else {
    const cats = [];
    for (let id in catData) {
      cats.push({
        value: id,
        label: `${catData[id].cat_name} (${catData[id].cat_code})`,
      });
    }
    cats.push({
      value: "any",
      label: t`Any`,
    });
    // sort the cats into alphabetical order with any on the top
    cats.sort((a, b) => {
      if (a.value === "any") {
        return -1;
      } else {
        return a.label.localeCompare(b.label);
      }
    });
    const fromValue = cats.find((c) => {
      return c.value === fromCat?.id;
    });
    const toValue = cats.find((c) => {
      return c.value === toCat?.id;
    });

    return (
      <div>
        <div className="container">
          <div className="row mb-2">
            <div className="card" role="button" {...getRootProps()}>
              <div className="card-body text-center">
                <h5 className="card-title">
                  <Trans>Add Offers to the Pool</Trans>
                </h5>
                <span className="">
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <span>
                      <Trans>Drop offers here...</Trans>
                    </span>
                  ) : (
                    <span>
                      <Trans>
                        Drag offers here or click to select offer files
                      </Trans>
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="row">
            <span className="h4">
              <Trans>Find offers from one coin to another</Trans>
            </span>
          </div>
          <div className="row">
            <div className="col-lg-3">
              <Select
                options={cats}
                value={fromValue}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                onChange={onchangeSelectFrom}
                isSearchable={true}
                classNamePrefix="cat-selector"
              />
            </div>
            <div className="col-lg-1 my-auto text-center">
              <button className="btn btn-link" onClick={onInvertCats}>
                <FontAwesomeIcon icon="exchange-alt" />
              </button>
            </div>

            <div className="col-lg-3">
              <Select
                options={cats}
                value={toValue}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
                onChange={onchangeSelectTo}
                isSearchable={true}
                classNamePrefix="cat-selector"
              />
            </div>
          </div>
        </div>
        {!offersLoaded ? (
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
                        return printOffer(offer, account);
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
                    <div ref={infiniteRefOffers} />
                  </div>
                  {/** Hide inverse offers if both are any */}
                  <div className="pt-1 col-lg-6">
                    <span className="h4">
                      {fromCat?.id === "any" && toCat?.id === "any" ? (
                        ""
                      ) : (
                        <Trans>Inverse Offers</Trans>
                      )}
                    </span>
                    <div>
                      {inverseOffers?.map((offer: any) => {
                        return printInverseOffer(offer, account);
                      })}
                    </div>
                    {loadingInverseOffers && (
                      <p>
                        <Trans>Loading...</Trans>
                      </p>
                    )}
                    {errorLoadingInverseOffers && (
                      <p>
                        <Trans>Error!</Trans>
                      </p>
                    )}
                    <div ref={infiniteRefInverseOffers} />
                  </div>
                </div>
              </div>
            )}
          </GobyContext.Consumer>
        )}
        <Modal
          show={isUploadResultOpen}
          onHide={() => {
            setIsUploadResultOpen(false);
          }}
          dialogClassName="modal-lg"
        >
          <ThemeContext.Consumer>
            {({ theme }) => (
              <Modal.Header
                closeButton
                closeVariant={theme === "dark-mode-content" ? "white" : undefined}
              >
                <Modal.Title>
                  <Trans>Upload Results</Trans>
                </Modal.Title>
              </Modal.Header>
            )}
          </ThemeContext.Consumer>
          <Modal.Body>
            <div>
              {uploadResults?.files?.map((f: any, i: any) => {
                return (
                  <div className="card" key={f.path}>
                    <div className="card-body text-center">
                      <h5 className="card-title">{f.path}</h5>
                      {uploadResults.results[i]}
                    </div>
                  </div>
                );
              })}
            </div>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

const getUnknownCatCode = (cat_id: string) => {
  return `${t`Unknown`} ${cat_id.slice(0, 5)}...${cat_id.slice(
    cat_id.length - 5
  )}`;
};

const printOffer = (offer: ResultType & {price?: number}, account: any) => {
  const offered = [];
  const requested = [];
  for (const cat of offer.info.offered) {
    offered.push({
      amount:
        cat.amount / (cat?.mojos_per_coin || 1000),
      code: cat.cat_code || getUnknownCatCode(cat.component_id),
    });
  }
  for (const cat of offer.info.requested) {
    requested.push({
      amount: cat.amount / (cat?.mojos_per_coin || 1000),
      code: cat.cat_code || getUnknownCatCode(cat.component_id),
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
              <Link
                to={`/offers/${offer.id}`}
                className="link-secondary download-button"
                title={t`download offer file`}
              >
                <FontAwesomeIcon icon="info" />
              </Link>
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

const printInverseOffer = (offer: ResultType & {price?: number}, account: any) => {
  const offered = [];
  const requested = [];
  for (const cat of offer.info.offered) {
    offered.push({
      amount: cat.amount / (cat?.mojos_per_coin || 1000),
      code: cat?.cat_code || getUnknownCatCode(cat.component_id),
    });
  }
  for (const cat of offer.info.requested) {
    requested.push({
      amount:
        cat.amount / (cat?.mojos_per_coin || 1000),
      code: cat?.cat_code || getUnknownCatCode(cat.component_id),
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
              <Link
                to={`/offers/${offer.id}`}
                className="link-secondary download-button"
                title={t`download offer file`}
              >
                <FontAwesomeIcon icon="info" />
              </Link>
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OfferList;
