import { ThemeContext } from "../contexts/ThemeContext";
import { useState } from "react";
import { Modal } from "react-bootstrap";
import { t } from "@lingui/macro";

export const TakeOfferInGoby = ({ offer, account }: any) => {
  const [isTakeResultOpen, setIsTakeResultOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState();

  if (!account) {
    return <></>;
  }

  async function takeOffer() {
    try {
      await (window as any).chia.request({
        method: "takeOffer",
        params: { offer: offer.offer, fee: 0 },
      });
    } catch (err: any) {
      setErrorMessage(err.message);
      setIsTakeResultOpen(true);
    }
  }

  return (
    <>
      <ThemeContext.Consumer>
        {({ theme }) => (
          <button
            onClick={takeOffer}
            className="btn-link-secondary goby-button"
            title={t`take offer in goby`}
          >
            <img
              src={
                theme === "dark-mode-content"
                  ? "/images/goby-logo-white.svg"
                  : "/images/goby-logo.svg"
              }
              height="30"
              width="23"
              alt="take offer in goby"
              className="align-top"
            />
          </button>
        )}
      </ThemeContext.Consumer>
      <Modal
        show={isTakeResultOpen}
        onHide={() => {
          setIsTakeResultOpen(false);
        }}
        dialogClassName="modal-lg"
      >
        <ThemeContext.Consumer>
          {({ theme }) => (
            <Modal.Header
              closeButton
              closeVariant={theme === "dark-mode-content" ? "white" : ""}
            >
              <Modal.Title>Error Taking Offer</Modal.Title>
            </Modal.Header>
          )}
        </ThemeContext.Consumer>
        <Modal.Body>
          <div>Error: {errorMessage}</div>
        </Modal.Body>
      </Modal>
    </>
  );
};
