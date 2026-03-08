import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import es from './locales/es.json';

const SUPPORTED = ['pt-BR', 'en-US', 'es'];

function detectLanguage() {
  const stored = localStorage.getItem('language');
  if (stored && SUPPORTED.includes(stored)) return stored;
  const browser = navigator.language;
  if (SUPPORTED.includes(browser)) return browser;
  const partial = SUPPORTED.find(l => l.startsWith(browser.split('-')[0]));
  return partial || 'pt-BR';
}

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS },
    'es': { translation: es },
  },
  lng: detectLanguage(),
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

export default i18n;
