import countries from 'i18n-iso-countries';
import ptLocale from 'i18n-iso-countries/langs/pt.json';

countries.registerLocale(ptLocale);

export { countries };
export const countryName = (alpha2) => countries.getName(alpha2, 'pt') || alpha2;
