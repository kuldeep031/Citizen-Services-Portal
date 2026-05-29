import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enPublic from './locales/en/public.json';
import enCitizen from './locales/en/citizen.json';
import hiCommon from './locales/hi/common.json';
import hiPublic from './locales/hi/public.json';
import hiCitizen from './locales/hi/citizen.json';
import bnCommon from './locales/bn/common.json';
import bnPublic from './locales/bn/public.json';
import bnCitizen from './locales/bn/citizen.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, public: enPublic, citizen: enCitizen },
      hi: { common: hiCommon, public: hiPublic, citizen: hiCitizen },
      bn: { common: bnCommon, public: bnPublic, citizen: bnCitizen },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'public', 'citizen'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'citizen_portal_lang',
    },
  });

export default i18n;
