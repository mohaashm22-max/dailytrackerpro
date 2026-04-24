import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";

export type Lang = "en" | "ar";

type Dict = Record<string, string>;

const EN: Dict = {
  "nav.calendar": "Calendar",
  "nav.analysis": "Analysis",
  "nav.notes": "Notes",
  "common.signOut": "Sign out",
  "common.close": "Close",
  "common.cancel": "Cancel",
  "common.add": "Add",
  "common.save": "Save",
  "common.delete": "Delete",
  "lang.toggle": "العربية",
  "lang.label": "Language",
};

const AR: Dict = {
  "nav.calendar": "التقويم",
  "nav.analysis": "التحليل",
  "nav.notes": "الملاحظات",
  "common.signOut": "تسجيل الخروج",
  "common.close": "إغلاق",
  "common.cancel": "إلغاء",
  "common.add": "إضافة",
  "common.save": "حفظ",
  "common.delete": "حذف",
  "lang.toggle": "English",
  "lang.label": "اللغة",
};

const DICTS: Record<Lang, Dict> = { en: EN, ar: AR };

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "dt2026:lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "ar" ? "ar" : "en";
  });

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((l) => (l === "en" ? "ar" : "en")), []);
  const t = useCallback((key: string) => DICTS[lang][key] ?? EN[key] ?? key, [lang]);

  const value = useMemo(() => ({ lang, setLang, toggle, t, dir }), [lang, setLang, toggle, t, dir]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
