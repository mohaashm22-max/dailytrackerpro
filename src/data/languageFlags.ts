// Maps language codes to representative ISO 3166-1 alpha-2 country codes
// for flag display purposes.
export const LANGUAGE_COUNTRY: Record<string, string> = {
  en: "GB", ar: "SA", es: "ES", fr: "FR", de: "DE", it: "IT", pt: "PT",
  ru: "RU", zh: "CN", ja: "JP", ko: "KR", hi: "IN", bn: "BD", ur: "PK",
  fa: "IR", tr: "TR", id: "ID", ms: "MY", vi: "VN", th: "TH",
  nl: "NL", pl: "PL", uk: "UA", sv: "SE", no: "NO", da: "DK", fi: "FI",
  el: "GR", cs: "CZ", ro: "RO", hu: "HU", sk: "SK", bg: "BG", sr: "RS",
  hr: "HR", sw: "KE", am: "ET", ta: "IN", te: "IN", ml: "IN", mr: "IN",
  gu: "IN", pa: "IN", ne: "NP", si: "LK", my: "MM", km: "KH", az: "AZ",
  kk: "KZ", uz: "UZ", hy: "AM", ka: "GE", is: "IS", ga: "IE", cy: "GB",
  af: "ZA", zu: "ZA", yo: "NG", ha: "NG", ig: "NG", tl: "PH",
};

export function countryForLanguage(langCode: string): string | undefined {
  return LANGUAGE_COUNTRY[langCode];
}
