import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: en
    },

    lng: 'en',

    // debug: true,

    // cache: { enabled: true },

    keySeparator: false,

    interpolation: {
      escapeValue: false, // not needed for react as it does escape per default to prevent xss!
    },
  })

export default i18n
