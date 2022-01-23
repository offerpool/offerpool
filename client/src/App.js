import "./App.css";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import fontawesome from "@fortawesome/fontawesome";
import {
  faTimes,
  faSpinner,
  faExchangeAlt,
  faFileDownload,
} from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";

fontawesome.library.add(faTimes, faSpinner, faExchangeAlt, faFileDownload);

function App() {
  // Get the cats available
  const [offersLoaded, setOffersLoaded] = useState(false);
  const [catsLoaded, setCatsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catData, setCatData] = useState();
  const [fromCat, setFromCat] = useState();
  const [toCat, setToCat] = useState();
  const [offers, setOffers] = useState();
  const [inverseOffers, setInverseOffers] = useState();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isUploadResultOpen, setIsUploadResultOpen] = useState(false);
  const [uploadResults, setUploadResults] = useState();

  useEffect(() => {
    if (!catData && !loading) {
      setLoading(true);
      axios.get("/api/v1/cats").then((res) => {
        setToCat(res.data["xch"]);
        setFromCat(
          res.data[
            "6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589"
          ]
        );
        setCatData(res.data);
        setCatsLoaded(true);
      });
    }
  }, [loading, catData]);

  useEffect(() => {
    if (!fromCat || !toCat) {
      return;
    }
    if (offers || inverseOffers) {
      return;
    }
    const loadOffers = async () => {
      const offers = [];
      const inverseOffers = [];
      let moreOffers = true;
      let moreInverseOffers = true;
      let page = 1;
      while (moreOffers) {
        const result = await axios.get(
          `/api/v1/offers?offered=${fromCat.id}&requested=${toCat.id}&page=${page}`
        );
        for (let i = 0; i < result.data.offers.length; i++) {
          const offer = result.data.offers[i];
          offer.price =
            offer.summary.offered[fromCat.id] /
            fromCat.mojos_per_coin /
            (offer.summary.requested[toCat.id] / toCat.mojos_per_coin);

          offers.push(result.data.offers[i]);
        }
        if (result.data.count < page * result.data.page_size) {
          moreOffers = false;
        } else {
          page = page + 1;
        }
      }
      page = 1;
      while (moreInverseOffers) {
        const result = await axios.get(
          `/api/v1/offers?requested=${fromCat.id}&offered=${toCat.id}&page=${page}`
        );
        for (let i = 0; i < result.data.offers.length; i++) {
          const inverseOffer = result.data.offers[i];
          inverseOffer.price =
            inverseOffer.summary.requested[fromCat.id] /
            fromCat.mojos_per_coin /
            (inverseOffer.summary.offered[toCat.id] / toCat.mojos_per_coin);
          inverseOffers.push(inverseOffer);
        }
        if (result.data.count < page * result.data.page_size) {
          moreInverseOffers = false;
        } else {
          page++;
        }
      }
      // sort the offers by price relative to the other item
      offers.sort((a, b) => {
        return b.price - a.price;
      });

      inverseOffers.sort((a, b) => {
        return a.price - b.price;
      });
      setOffers(offers);
      setInverseOffers(inverseOffers);
    };
    loadOffers();
  }, [fromCat, toCat, offers, inverseOffers]);

  useEffect(() => {
    setOffersLoaded(offers && inverseOffers);
  }, [offers, inverseOffers]);

  const onchangeSelectFrom = (item) => {
    setOffers(undefined);
    setInverseOffers(undefined);
    setFromCat(catData[item.value]);
  };

  const onchangeSelectTo = (item) => {
    setOffers(undefined);
    setInverseOffers(undefined);
    setToCat(catData[item.value]);
  };

  const onInvertCats = () => {
    const tempToCat = fromCat;
    const tempFromCat = toCat;
    setToCat(tempToCat);
    setFromCat(tempFromCat);
    setOffers(undefined);
    setInverseOffers(undefined);
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
              </div>
              <div className="pt-1 col-lg-6">
                <span className="h4">Inverse Offers</span>
                <div>
                  {inverseOffers?.map((offer) => {
                    return printInverseOffer(offer, catData);
                  })}
                </div>
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
          <div className="card-body pt-0">Price: {offer.price}</div>
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
                  .join("")}.txt`}
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
          <div className="card-body pt-0">Price: {offer.price}</div>
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
                  .join("")}.txt`}
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
