import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { LANGUAGES, RTL_CODES } from "@/data/languages";

export type Lang = string;

type Dict = Record<string, string>;

const EN: Dict = {
  "nav.calendar": "Calendar",
  "nav.analysis": "Analysis",
  "nav.notes": "Notes",
  "nav.settings": "Settings",
  "common.signOut": "Sign out",
  "common.close": "Close",
  "common.cancel": "Cancel",
  "common.add": "Add",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.search": "Search",
  "common.noResults": "No results",
  "lang.toggle": "العربية",
  "lang.label": "Language",
  "lang.select": "Select language",
  "lang.searchPlaceholder": "Search language",
  "country.label": "Country",
  "country.select": "Select country",
  "country.searchPlaceholder": "Search country",
  "settings.title": "Settings",
  "settings.subtitle": "Manage your profile, preferences, and account",
  "settings.profile": "Profile",
  "settings.profileDesc": "Update your personal information",
  "settings.name": "Name",
  "settings.address": "Address",
  "settings.changeAvatar": "Change profile picture",
  "settings.avatarUpdated": "Profile picture updated",
  "settings.invalidImage": "Please choose an image file",
  "settings.imageTooLarge": "Image must be under 5MB",
  "settings.saved": "Saved",
  "settings.preferences": "Preferences",
  "settings.preferencesDesc": "Theme and language",
  "settings.theme": "Theme",
  "settings.lightMode": "Light mode",
  "settings.darkMode": "Dark mode",
  "settings.language": "Language",
  "settings.account": "Account",
  "settings.accountDesc": "Manage your account security",
  "settings.resetPassword": "Reset password",
  "settings.resetPasswordDesc": "Enter your current password and choose a new one",
  "settings.currentPassword": "Current password",
  "settings.newPassword": "New password",
  "settings.passwordUpdated": "Password updated",
  "settings.wrongCurrentPw": "Current password is incorrect",
  "settings.weakPassword": "Password does not meet all requirements",
};

const AR: Dict = {
  "nav.calendar": "التقويم",
  "nav.analysis": "التحليل",
  "nav.notes": "الملاحظات",
  "nav.settings": "الإعدادات",
  "common.signOut": "تسجيل الخروج",
  "common.close": "إغلاق",
  "common.cancel": "إلغاء",
  "common.add": "إضافة",
  "common.save": "حفظ",
  "common.delete": "حذف",
  "common.search": "بحث",
  "common.noResults": "لا توجد نتائج",
  "lang.toggle": "English",
  "lang.label": "اللغة",
  "lang.select": "اختر اللغة",
  "lang.searchPlaceholder": "ابحث عن لغة",
  "country.label": "الدولة",
  "country.select": "اختر الدولة",
  "country.searchPlaceholder": "ابحث عن دولة",
  "settings.title": "الإعدادات",
  "settings.subtitle": "إدارة ملفك الشخصي والتفضيلات والحساب",
  "settings.profile": "الملف الشخصي",
  "settings.profileDesc": "تحديث معلوماتك الشخصية",
  "settings.name": "الاسم",
  "settings.address": "العنوان",
  "settings.changeAvatar": "تغيير صورة الملف الشخصي",
  "settings.avatarUpdated": "تم تحديث الصورة",
  "settings.invalidImage": "يرجى اختيار ملف صورة",
  "settings.imageTooLarge": "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
  "settings.saved": "تم الحفظ",
  "settings.preferences": "التفضيلات",
  "settings.preferencesDesc": "المظهر واللغة",
  "settings.theme": "المظهر",
  "settings.lightMode": "الوضع الفاتح",
  "settings.darkMode": "الوضع الداكن",
  "settings.language": "اللغة",
  "settings.account": "الحساب",
  "settings.accountDesc": "إدارة أمان حسابك",
  "settings.resetPassword": "إعادة تعيين كلمة المرور",
  "settings.resetPasswordDesc": "أدخل كلمة المرور الحالية واختر كلمة مرور جديدة",
  "settings.currentPassword": "كلمة المرور الحالية",
  "settings.newPassword": "كلمة المرور الجديدة",
  "settings.passwordUpdated": "تم تحديث كلمة المرور",
  "settings.wrongCurrentPw": "كلمة المرور الحالية غير صحيحة",
  "settings.weakPassword": "كلمة المرور لا تستوفي جميع المتطلبات",
};

const DICTS: Record<string, Dict> = { en: EN, ar: AR };

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
  available: typeof LANGUAGES;
}

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "dt2026:lang";
const VALID_CODES = new Set(LANGUAGES.map((l) => l.code));

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem(STORAGE_KEY) || "";
    return VALID_CODES.has(saved) ? saved : "en";
  });

  const dir: "ltr" | "rtl" = RTL_CODES.has(lang) ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => {
    if (VALID_CODES.has(l)) setLangState(l);
  }, []);
  const toggle = useCallback(() => setLangState((l) => (l === "en" ? "ar" : "en")), []);
  const t = useCallback(
    (key: string) => DICTS[lang]?.[key] ?? EN[key] ?? key,
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, toggle, t, dir, available: LANGUAGES }),
    [lang, setLang, toggle, t, dir],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
