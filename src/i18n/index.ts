import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector"

import enCommon from "./locales/en/common";
import viCommon from "./locales/vi/common";

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: "en",
        supportedLngs: ["en", "vi"],
        resources: {
            en: { common: enCommon },
            vi: { common: viCommon },
        },
        ns: ["common"],
        defaultNS: "common",
        interpolation: {
            escapeValue: false,
        },

        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
        },
    })

export default i18n;