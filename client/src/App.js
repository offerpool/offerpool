import "./App.css";
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Modal } from "react-bootstrap";
import fontawesome from "@fortawesome/fontawesome";
import {
  faSpinner,
  faExchangeAlt,
  faFileDownload,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import OfferList from "./OfferList";
import { Trans } from "@lingui/macro";

fontawesome.library.add(faSpinner, faExchangeAlt, faFileDownload, faCopy);

function App() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  function toggleAbout() {
    setIsAboutOpen(!isAboutOpen);
  }

  return (
    <div className="col-lg-9 mx-auto p-3 py-md-5">
      <header className="align-items-center pb-3 mb-2 border-bottom text-dark text-decoration-none container">
        <div className="row">
          <div className="col-10">
            <h2>offerpool.io</h2>
          </div>
          <div className="col-2 my-auto">
            <button className="btn btn-link" onClick={toggleAbout}>
              <Trans>about offerpool</Trans>
            </button>
          </div>
        </div>
      </header>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OfferList />} />
        </Routes>
      </BrowserRouter>

      <Modal show={isAboutOpen} onHide={toggleAbout} dialogClassName="modal-lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Trans>About offerpool.io</Trans>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Trans>
            <p>
              offerpool is a{" "}
              <a href="https://github.com/offerpool/offerpool">open-source</a>{" "}
              decentralized database of chia network offers, built on top of
              orbitdb and ipfs.
            </p>
            <p>
              The goal of offerpool is to create a shared global collection of
              offers that anyone can access.
            </p>
            <p>
              offerpool.io uses the offerpool backend with a basic web UI. API
              documentation is available on github.
            </p>
          </Trans>
        </Modal.Body>
      </Modal>
      <footer className="text-center">
        <a href="https://twitter.com/offerpoolio"><Trans>twitter</Trans></a>{" "}
        <a href="https://github.com/offerpool/offerpool"><Trans>github</Trans></a>
        <br />© 2022 - {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default App;
