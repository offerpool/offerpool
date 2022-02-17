import React, { useState, useEffect } from 'react';
import { GobyContext } from './contexts/GobyContext';


const isGobyInstalled = () => {
    const { chia } = window;
    return Boolean(chia && chia.isGoby)
  }

export default function GobyContextWrapper(props) {
  const [account, setAccount] = useState("");
  useEffect(() => {
    if (isGobyInstalled()) {
        window.chia.on('accountsChanged', (accounts) => {
          setAccount(accounts?.[0]);
        })
        window.chia.on('chainChanged', () => window.location.reload());
        window.chia.request({method: 'accounts'}).then((accounts) => {
          setAccount(accounts?.[0]);
        })
      }
  })

  const handleConnect = async () => {
    if (isGobyInstalled()) {
      const accounts = await window.chia.request({method: 'requestAccounts'});
      setAccount(accounts?.[0]);
    }
  }

  return (
    <GobyContext.Provider value={{ account: account, isGobyInstalled: isGobyInstalled(), handleConnect }}>
      {props.children}
    </GobyContext.Provider>
  );
}