import { format as dfFormat, type Locale } from "date-fns";
import {
  ar, enUS, es, fr, de, it, pt, ru, zhCN, ja, ko, hi, tr, id, ms, vi, th,
  nl, pl, uk, sv, nb, da, fi, he, faIR, ro, cs, sk, hu, el, bg, hr, sr, sl,
  et, lv, lt, ca, gl, eu, af, sq, az, bs, mk, mt, is, cy, mn, ka, hy, kk,
  uz, kn, ta, te, bn, ur,
} from "date-fns/locale";

const LOCALES: Record<string, Locale> = {
  en: enUS, ar, es, fr, de, it, pt, ru, zh: zhCN, ja, ko, hi, tr, id, ms,
  vi, th, nl, pl, uk, sv, no: nb, da, fi, he, fa: faIR, ro, cs, sk, hu, el,
  bg, hr, sr, sl, et, lv, lt, ca, gl, eu, af, sq, az, bs, mk, mt, is, cy,
  mn, ka, hy, kk, uz, kn, ta, te, bn, ur,
};

export function localeFor(lang: string): Locale {
  return LOCALES[lang] ?? enUS;
}

export function tFormat(date: Date | number, fmt: string, lang: string): string {
  return dfFormat(date, fmt, { locale: localeFor(lang) });
}
