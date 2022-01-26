import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import fontawesome from "@fortawesome/fontawesome";
import {
  faSpinner,
  faExchangeAlt,
  faFileDownload,
} from "@fortawesome/free-solid-svg-icons";
import { useLoadOffers } from "./hooks/useLoadOffers";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { useDropzone } from "react-dropzone";
import { useLoadInverseOffers } from "./hooks/useLoadInverseOffers";

fontawesome.library.add(faSpinner, faExchangeAlt, faFileDownload);

function App() {
  // Get the cats available
  const [offersLoaded, setOffersLoaded] = useState(false);
  const [catsLoaded, setCatsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catData, setCatData] = useState();
  const [fromCat, setFromCat] = useState();
  const [toCat, setToCat] = useState();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isUploadResultOpen, setIsUploadResultOpen] = useState(false);
  const [uploadResults, setUploadResults] = useState();
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
    setOffersLoaded(offers && inverseOffers);
  }, [offers, inverseOffers]);

  const onchangeSelectFrom = (item) => {
    let newFromCat = { id: "any" };
    if (item.value !== "any") {
      newFromCat = catData[item.value];
    }
    setFromCat(newFromCat);
    clearOfferState();
    clearInverseOfferState();
    setCatsInHistory(newFromCat, toCat);
  };

  const onchangeSelectTo = (item) => {
    let newToCat = { id: "any" };
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

  const setCatsInHistory = (fromCat, toCat) => {
    // If they are both any, save that
    const fromCatString = (fromCat.cat_code ?? fromCat.id ?? "").toLowerCase();
    const toCatString = (toCat.cat_code ?? toCat.id ?? "").toLowerCase();
    if (fromCat.id === "any" && toCat.id === "any") {
      navigate(`/?from=${fromCatString}&to=${toCatString}`, { replace: true });
    }
    else if (fromCat.id === "any") {
    // If one is any, don't include it
      navigate(`/?to=${toCatString}`, { replace: true });
    }
    else if (toCat.id === "any") {
      navigate(`/?from=${fromCatString}`, { replace: true });
    }
    else {
    // Include both if neither are any
      navigate(`/?from=${fromCatString}&to=${toCatString}`, { replace: true });
    }
  };

  function toggleAbout() {
    setIsAboutOpen(!isAboutOpen);
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      var fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.onerror = reject;
      fr.readAsText(file);
    });
  }

  const onDrop = useCallback(async (files) => {
    // loop through the files and make sure they are valid offers, upload them to the api, an then list the results per filename
    const readPromises = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      readPromises.push(readFile(file));
    }
    const readResults = await Promise.all(readPromises);
    const results = [];
    for (let i = 0; i < readResults.length; i++) {
      const offer = readResults[i];
      if (!offer.startsWith("offer")) {
        results.push("Error adding offer, Invalid offer file");
        continue;
      }
      try {
        await axios.post("/api/v1/offers", { offer });
        results.push("Success");
      } catch (err) {
        if (err?.response?.data?.error_message) {
          results.push(
            `Error adding offer: ${err?.response?.data?.error_message}`
          );
        } else {
          results.push(`Error adding offer, try again later`);
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
      label: "Any",
    });
    const fromValue = cats.find((c) => {
      return c.value === fromCat.id;
    });
    const toValue = cats.find((c) => {
      return c.value === toCat.id;
    });

    return (
      <div className="col-lg-9 mx-auto p-3 py-md-5">
        <header className="align-items-center pb-3 mb-2 border-bottom text-dark text-decoration-none container">
          <div className="row">
            <div className="col-10">
              <h2>offerpool.io</h2>
            </div>
            <div className="col-2 my-auto">
              <button className="btn btn-link" onClick={toggleAbout}>
                About
              </button>
            </div>
          </div>
        </header>
        <div className="container">
          <div className="row mb-2">
            <div className="card" role="button" {...getRootProps()}>
              <div className="card-body text-center">
                <h5 className="card-title">Add Offers to the Pool</h5>
                <span className="">
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <span>Drop offers here ...</span>
                  ) : (
                    <span>Drag offers here or click to select offer files</span>
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="row">
            <span className="h4">Find offers from one coin to another</span>
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
              />
            </div>
          </div>
        </div>
        {!offersLoaded ? (
          <div>
            <FontAwesomeIcon icon="spinner" className="fa-spin" />
          </div>
        ) : (
          <div className="container">
            <div className="row">
              <div className="pt-1 col-lg-6">
                <span className="h4">Offers</span>
                <div>
                  {offers?.map((offer) => {
                    return printOffer(offer, catData);
                  })}
                </div>
                {loadingOffers && <p>Loading...</p>}
                {errorLoadingOffers && <p>Error!</p>}
                <div ref={infiniteRefOffers} />
              </div>
              {/** Hide inverse offers if both are any */}
              <div className="pt-1 col-lg-6">
                <span className="h4">
                  {fromCat.id === "any" && toCat.id === "any"
                    ? ""
                    : "Inverse Offers"}
                </span>
                <div>
                  {inverseOffers?.map((offer) => {
                    return printInverseOffer(offer, catData);
                  })}
                </div>
                {loadingInverseOffers && <p>Loading...</p>}
                {errorLoadingInverseOffers && <p>Error!</p>}
                <div ref={infiniteRefInverseOffers} />
              </div>
            </div>
          </div>
        )}
        <Modal
          show={isAboutOpen}
          onHide={toggleAbout}
          dialogClassName="modal-lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>About offerpool.io </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              offerpool is a open source decentralized database of chia network
              offers, built on top of orbitdb and ipfs.
            </p>
            <p>
              The goal of offerpool is to prevent any centralized player from
              controlling or monopolizing offer distribution.
            </p>
            <p>
              offerpool.io uses the offerpool backend with a barebones UI and
              API for interacting with the offerpool. API documentation is
              available on github.
            </p>
          </Modal.Body>
        </Modal>
        <Modal
          show={isUploadResultOpen}
          onHide={() => {
            setIsUploadResultOpen(false);
          }}
          dialogClassName="modal-lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Upload Results</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div>
              {uploadResults?.files?.map((f, i) => {
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
        <footer className="text-center">
          <a href="https://twitter.com/offerpoolio">twitter</a>{" "}
          <a href="https://github.com/offerpool/offerpool">github</a>
          <br />© 2022 - {new Date().getFullYear()}
        </footer>
      </div>
    );
  }
}

const getUnkownCatCode = (cat_id) => {
  return `Unknown ${cat_id.slice(0, 5)}...${cat_id.slice(cat_id.length - 5)}`;
};

const printOffer = (offer, catData) => {
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
            <h6>Offering</h6>
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
            <h6>Requesting</h6>
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
        <div className="col-8">
          {offer.price ? (
            <div className="card-body pt-0">Price: {offer.price}</div>
          ) : (
            <div className="card-body pt-0"> </div>
          )}
        </div>
        <div className="col-4">
          <div className="card-body pt-0">
            <h4>
              <a
                href={`data:text/plain,${offer.offer}`}
                download={`${offered
                  .map((r) => `${r.amount}${r.code}`)
                  .join("")}x${requested
                  .map((r) => `${r.amount}${r.code}`)
                  .join("")}.offer`}
                className="link-secondary"
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

const printInverseOffer = (offer, catData) => {
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
            <h6>Requesting</h6>
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
            <h6>Offering</h6>
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
        <div className="col-8">
          {offer.price ? (
            <div className="card-body pt-0">Price: {offer.price}</div>
          ) : (
            <div className="card-body pt-0"> </div>
          )}
        </div>
        <div className="col-4">
          <div className="card-body pt-0">
            <h4>
              <a
                href={`data:text/plain,${offer.offer}`}
                download={`${offered
                  .map((r) => `${r.amount}${r.code}`)
                  .join("")}x${requested
                  .map((r) => `${r.amount}${r.code}`)
                  .join("")}.offer`}
                className="link-secondary"
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

export default App;
