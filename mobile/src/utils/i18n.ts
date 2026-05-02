import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "../../assets/locales/ar.json";
import darija from "../../assets/locales/darija.json";
import fr from "../../assets/locales/fr.json";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  lng: "fr",
  fallbackLng: "fr",
  resources: {
    ar: { translation: ar },
    darija: { translation: darija },
    fr: { translation: fr },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
