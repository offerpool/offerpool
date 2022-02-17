import { createContext } from "react";

export const GobyContext = createContext({
    account: "",
    changeAccount: () => {},
});