import { createContext } from "react";

export const themes = {
  dark: "dark-mode-content",
  light: "",
};

export const ThemeContext = createContext({
  theme: themes.light,
  changeTheme: (theme: any) => {},
});
