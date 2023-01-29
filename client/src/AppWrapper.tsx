import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { availableLocales, defaultLocale, dynamicActivate } from "./i18n";
import App from "./App";
import { useEffect, useState } from "react";
import {
  multipleDetect,
  fromUrl,
  fromSubdomain,
  fromNavigator,
} from "@lingui/detect-locale";

function AppWrapper() {
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const DEFAULT_FALLBACK = () => defaultLocale;
    const results = multipleDetect(
      fromUrl("lang"),
      fromSubdomain(0),
      fromNavigator(),
      DEFAULT_FALLBACK
    );
    let lang = undefined;
    for (let i = 0; i < results.length; i++) {
      if (!lang && availableLocales.indexOf(results[i]) > -1) {
        lang = results[i];
      }
    }
    dynamicActivate(lang || defaultLocale);
    setActivated(true);
  }, []);

  return activated ? (
    <I18nProvider i18n={i18n}>
      <App />
    </I18nProvider>
  ) : (
    <div></div>
  );
}

export default AppWrapper;
