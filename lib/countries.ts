export interface Country {
  code: string;
  name: string;
  flag: string;
}

const getFlagEmoji = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const STRIPE_COUNTRIES: Country[] = [
  { code: 'AU', name: 'Australia', flag: getFlagEmoji('AU') },
  { code: 'AT', name: 'Austria', flag: getFlagEmoji('AT') },
  { code: 'BE', name: 'Belgium', flag: getFlagEmoji('BE') },
  { code: 'BR', name: 'Brazil', flag: getFlagEmoji('BR') },
  { code: 'BG', name: 'Bulgaria', flag: getFlagEmoji('BG') },
  { code: 'CA', name: 'Canada', flag: getFlagEmoji('CA') },
  { code: 'HR', name: 'Croatia', flag: getFlagEmoji('HR') },
  { code: 'CY', name: 'Cyprus', flag: getFlagEmoji('CY') },
  { code: 'CZ', name: 'Czech Republic', flag: getFlagEmoji('CZ') },
  { code: 'DK', name: 'Denmark', flag: getFlagEmoji('DK') },
  { code: 'EE', name: 'Estonia', flag: getFlagEmoji('EE') },
  { code: 'FI', name: 'Finland', flag: getFlagEmoji('FI') },
  { code: 'FR', name: 'France', flag: getFlagEmoji('FR') },
  { code: 'DE', name: 'Germany', flag: getFlagEmoji('DE') },
  { code: 'GI', name: 'Gibraltar', flag: getFlagEmoji('GI') },
  { code: 'GR', name: 'Greece', flag: getFlagEmoji('GR') },
  { code: 'HK', name: 'Hong Kong', flag: getFlagEmoji('HK') },
  { code: 'HU', name: 'Hungary', flag: getFlagEmoji('HU') },
  { code: 'IE', name: 'Ireland', flag: getFlagEmoji('IE') },
  { code: 'IT', name: 'Italy', flag: getFlagEmoji('IT') },
  { code: 'JP', name: 'Japan', flag: getFlagEmoji('JP') },
  { code: 'LV', name: 'Latvia', flag: getFlagEmoji('LV') },
  { code: 'LI', name: 'Liechtenstein', flag: getFlagEmoji('LI') },
  { code: 'LT', name: 'Lithuania', flag: getFlagEmoji('LT') },
  { code: 'LU', name: 'Luxembourg', flag: getFlagEmoji('LU') },
  { code: 'MY', name: 'Malaysia', flag: getFlagEmoji('MY') },
  { code: 'MT', name: 'Malta', flag: getFlagEmoji('MT') },
  { code: 'MX', name: 'Mexico', flag: getFlagEmoji('MX') },
  { code: 'NL', name: 'Netherlands', flag: getFlagEmoji('NL') },
  { code: 'NZ', name: 'New Zealand', flag: getFlagEmoji('NZ') },
  { code: 'NO', name: 'Norway', flag: getFlagEmoji('NO') },
  { code: 'PL', name: 'Poland', flag: getFlagEmoji('PL') },
  { code: 'PT', name: 'Portugal', flag: getFlagEmoji('PT') },
  { code: 'RO', name: 'Romania', flag: getFlagEmoji('RO') },
  { code: 'SG', name: 'Singapore', flag: getFlagEmoji('SG') },
  { code: 'SK', name: 'Slovakia', flag: getFlagEmoji('SK') },
  { code: 'SI', name: 'Slovenia', flag: getFlagEmoji('SI') },
  { code: 'ES', name: 'Spain', flag: getFlagEmoji('ES') },
  { code: 'SE', name: 'Sweden', flag: getFlagEmoji('SE') },
  { code: 'CH', name: 'Switzerland', flag: getFlagEmoji('CH') },
  { code: 'TH', name: 'Thailand', flag: getFlagEmoji('TH') },
  { code: 'AE', name: 'United Arab Emirates', flag: getFlagEmoji('AE') },
  { code: 'GB', name: 'United Kingdom', flag: getFlagEmoji('GB') },
  { code: 'US', name: 'United States', flag: getFlagEmoji('US') },
];
