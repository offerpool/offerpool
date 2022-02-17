import { bech32m } from "bech32";
import { ThemeContext } from "../contexts/ThemeContext";
import { Buffer } from "buffer"

export function toChainAddress(address) {
  if (!Buffer.isBuffer(address)) {
    address = Buffer.from(address, 'hex');
  }
  return bech32m.encode('xch', bech32m.toWords(address));
}

const GobyUserInfo = ({ account }) => { 
  const chainAddress = toChainAddress(account);

  return (
    <ThemeContext.Consumer>
      {({ theme }) => (
        <span className="connect-goby-button me-2 py-3">
          <img
            src={
              theme === "dark-mode-content"
                ? "/images/goby-logo-white.svg"
                : "/images/goby-logo.svg"
            }
            height="23"
            width="23"
            alt="connected to goby wallet"
            className="align-top"
          />
          {` ${chainAddress.slice(0, 6)}...${chainAddress.slice(-4)}`}
        </span>
      )}
    </ThemeContext.Consumer>
  );
};

export default GobyUserInfo;
