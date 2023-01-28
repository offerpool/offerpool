import { i18n } from "@lingui/core";
import { en, fr, de } from "make-plural/plurals";

export const availableLocales = ["en", "fr", "de"];

export const defaultLocale = "en";

i18n.loadLocaleData({
  en: { plurals: en },
  fr: { plurals: fr },
  de: { plurals: de },
});

/**
 * We do a dynamic import of just the catalog that we need
 * @param locale any locale string
 */
export async function dynamicActivate(locale: any) {
  const { messages } = await import(`./locales/${locale}/messages`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}
