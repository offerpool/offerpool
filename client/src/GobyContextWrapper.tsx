import React, { useState, useEffect } from "react";
import { GobyContext } from "./contexts/GobyContext";

const isGobyInstalled = () => {
  const { chia } = window as any;
  return Boolean(chia && chia.isGoby);
};

export default function GobyContextWrapper(props: any) {
  const [account, setAccount] = useState("");
  useEffect(() => {
    if (isGobyInstalled()) {
      window.chia.on("accountsChanged", (accounts: any) => {
          setAccount(accounts?.[0]);
        });
      window.chia.on("chainChanged", () => window.location.reload());
      window.chia.request({ method: "accounts" })
        .then((accounts: any) => {
          setAccount(accounts?.[0]);
        });
    }
  });

  const handleConnect = async () => {
    if (isGobyInstalled()) {
      const accounts = await (window as any).chia.request({
        method: "requestAccounts",
      });
      setAccount(accounts?.[0]);
    }
  };

  return (
    <GobyContext.Provider
      value={{
        account: account,
        isGobyInstalled: isGobyInstalled(),
        handleConnect,
        changeAccount: handleConnect,
      }}
    >
      {props.children}
    </GobyContext.Provider>
  );
}
