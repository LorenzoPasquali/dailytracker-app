import { ptBR } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { es } from 'date-fns/locale';

export const datepickerLocales = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es': es,
};

export const getDatepickerLocale = (lng) =>
  datepickerLocales[lng] ?? ptBR;
