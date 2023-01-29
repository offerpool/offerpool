import { createContext } from "react";

export const GobyContext = createContext({
  account: "",
  isGobyInstalled: false,
  changeAccount: () => {},
  handleConnect: async () => {},
});
