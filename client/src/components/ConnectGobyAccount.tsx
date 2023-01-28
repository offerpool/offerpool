import { ThemeContext } from "../contexts/ThemeContext";
import { Button } from "react-bootstrap";

export const ConnectGobyAccount = ({ handleConnect }: any) => {
  return (
    <ThemeContext.Consumer>
      {({ theme }) => (
        <Button
          onClick={handleConnect}
          className="connect-goby-button me-2 py-0"
        >
          <img
            src={
              theme === "dark-mode-content"
                ? "/images/goby-logo-white.svg"
                : "/images/goby-logo.svg"
            }
            height="23"
            width="23"
            alt="connect to goby wallet"
            className="align-top"
          />{" "}
          Connect
        </Button>
      )}
    </ThemeContext.Consumer>
  );
};
