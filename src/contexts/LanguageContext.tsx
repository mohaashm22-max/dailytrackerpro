import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { LANGUAGES, RTL_CODES } from "@/data/languages";
import { tFormat, localeFor } from "@/lib/i18nDate";
import type { Locale } from "date-fns";
import { EXTRA_DICTS } from "@/i18n/translations";

export type Lang = string;

type Dict = Record<string, string>;

const EN: Dict = {
  // nav / common
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
  "common.back": "Back",
  "common.untitled": "Untitled",

  // language / country
  "lang.toggle": "العربية",
  "lang.label": "Language",
  "lang.select": "Select language",
  "lang.searchPlaceholder": "Search language",
  "country.label": "Country",
  "country.select": "Select country",
  "country.searchPlaceholder": "Search country",

  // brand
  "brand.title": "Daily Tracker",
  "brand.year": "2026",

  // calendar
  "calendar.title": "Calendar",
  "calendar.subtitle": "Tap any day to open its tasks. Tracker runs {start} – {end}.",
  "calendar.prevMonth": "Previous month",
  "calendar.nextMonth": "Next month",
  "calendar.today": "Today",
  "calendar.renameDay": "Rename this day",
  "calendar.quickAdd": "Quick add task or section",
  "weekday.sun": "Sun",
  "weekday.mon": "Mon",
  "weekday.tue": "Tue",
  "weekday.wed": "Wed",
  "weekday.thu": "Thu",
  "weekday.fri": "Fri",
  "weekday.sat": "Sat",

  // status
  "status.excellent": "Excellent",
  "status.veryGood": "Very Good",
  "status.okay": "Okay",
  "status.started": "Started",
  "status.empty": "Empty",

  // day drawer
  "day.dayName": "Day name:",
  "day.tasksOf": "{done} / {total} tasks",
  "day.noBlocks": "No blocks yet. Add a block to start organizing this day.",
  "day.addBlock": "Add block",
  "day.addSection": "Add section",
  "day.addTask": "Add task",
  "day.newBlock": "New block",
  "day.newSection": "New section",
  "day.newTask": "New task",
  "day.untitledBlock": "Untitled block",
  "day.noSections": "No sections yet.",
  "day.emptyTask": "Empty task",
  "day.deleteBlock": "Delete block",
  "day.deleteSection": "Delete section",
  "day.deleteTask": "Delete task",
  "day.renameBlock": "Rename block",
  "day.collapseBlock": "Collapse block",
  "day.expandBlock": "Expand block",
  "day.collapseSection": "Collapse section",
  "day.expandSection": "Expand section",
  "day.dayNote": "📝 How was your day?",
  "day.linkedNotes": "Linked notes",

  // notes page
  "notes.title": "Notes",
  "notes.subtitle": "Free-form thoughts, reminders, and ideas.",
  "notes.new": "New note",
  "notes.empty": "No notes yet — create one.",
  "notes.noMatches": "No matches.",
  "notes.untitled": "Untitled note",
  "notes.noContent": "No content",
  "notes.lastUpdated": "Last updated {when}",
  "notes.linkedDay": "Linked day:",
  "notes.linkPick": "Link to a calendar day",
  "notes.unlink": "Unlink",
  "notes.selectOrCreate": "Select or create a note to begin.",
  "notes.editor.bold": "Bold",
  "notes.editor.italic": "Italic",
  "notes.editor.bullet": "Bullet list",
  "notes.editor.numbered": "Numbered list",

  // analysis
  "analysis.title": "Analysis",
  "analysis.subtitle": "Track your monthly and yearly progress.",
  "analysis.yearCompletion": "Year completion",
  "analysis.tasksDone": "{n} tasks done",
  "analysis.daysTracked": "Days tracked",
  "analysis.ofN": "of {n}",
  "analysis.currentStreak": "Current streak",
  "analysis.bestStreak": "Best streak",
  "analysis.daysGte50": "days ≥ 50%",
  "analysis.yearlyProgress": "Yearly progress (avg % per month)",
  "analysis.monthly": "Monthly analysis",
  "analysis.avgCompletion": "Avg completion",
  "analysis.bestDay": "Best day",
  "analysis.daysAt50": "Days ≥ 50%",
  "analysis.tasksDoneShort": "Tasks done",
  "analysis.dailyCompletion": "Daily completion",
  "analysis.byCategory": "By category",
  "analysis.taskShare": "Task share by category",
  "analysis.completion": "Completion",
  "analysis.day": "Day",

  // quick add
  "qa.title": "Quick add",
  "qa.subtitle": "Add a task, a whole section, or an entire block to one day, a date range, or every day of the year.",
  "qa.tab.task": "Task",
  "qa.tab.section": "Section",
  "qa.tab.block": "Block",
  "qa.task": "Task",
  "qa.block": "Block",
  "qa.section": "Section",
  "qa.sectionOptional": "Section (optional)",
  "qa.sectionTitle": "Section title",
  "qa.starterTasks": "Starter tasks (one per line, optional)",
  "qa.blockTitle": "Block title",
  "qa.sections": "Sections (one per line — format:",
  "qa.note": "Block and section will be created on each selected day if they don't exist yet.",
  "qa.applyTo": "Apply to",
  "qa.allYear": "All year",
  "qa.singleDay": "Single day",
  "qa.dateRange": "Date range",
  "qa.date": "Date",
  "qa.start": "Start",
  "qa.end": "End",
  "qa.allYearNote": "Will apply to every day from {start} – {end}.",
  "qa.pickDate": "Pick a date first",
  "qa.taskRequired": "Task text is required",
  "qa.sectionRequired": "Section title is required",
  "qa.blockRequired": "Block title is required",
  "qa.taskAdded": "Task added",
  "qa.sectionAdded": "Section added",
  "qa.blockCreated": "Block created",
  "qa.appliedTo": "Applied to {n} day(s).",

  // settings
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

  // auth
  "auth.brandSubtitle": "Sign in to sync your year, your way.",
  "auth.tab.login": "Login",
  "auth.tab.signup": "Sign up",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.confirmPassword": "Confirm password",
  "auth.name": "Name",
  "auth.forgot": "Forgot password?",
  "auth.remember": "Remember me on this device",
  "auth.signIn": "Sign in",
  "auth.createAccount": "Create account",
  "auth.orContinue": "Or continue with",
  "auth.continueGoogle": "Continue with Google",
  "auth.terms": "By continuing you agree to our",
  "auth.termsLink": "Terms",
  "auth.and": "and",
  "auth.privacyLink": "Privacy Policy",
  "auth.reset.title": "Reset your password",
  "auth.reset.desc": "Enter your email and we'll send you a reset link.",
  "auth.reset.send": "Send reset link",
  "auth.reset.back": "Back to sign in",
  "auth.reset.sent": "Password reset email sent — check your inbox.",
  "auth.invalidCreds": "Invalid email or password",
  "auth.welcomeBack": "Welcome back!",
  "auth.created": "Account created! You're signed in.",
  "auth.exists": "An account with this email already exists",
  "auth.enterPw": "Enter your password",
  "auth.weakPw": "Password does not meet all requirements",
  "auth.pwMismatch": "Passwords do not match",
  "auth.pwMatch": "Passwords match",
  "auth.strength": "Strength:",
  "auth.showPw": "Show password",
  "auth.hidePw": "Hide password",
  "auth.googleFailed": "Google sign-in failed",
  "auth.setNew.title": "Set a new password",
  "auth.setNew.descReady": "Enter a strong password to finish resetting your account.",
  "auth.setNew.descNotReady": "Open the reset link from your email to continue.",
  "auth.setNew.update": "Update password",
  "auth.setNew.updated": "Password updated",
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
  "common.back": "رجوع",
  "common.untitled": "بدون عنوان",

  "lang.toggle": "English",
  "lang.label": "اللغة",
  "lang.select": "اختر اللغة",
  "lang.searchPlaceholder": "ابحث عن لغة",
  "country.label": "الدولة",
  "country.select": "اختر الدولة",
  "country.searchPlaceholder": "ابحث عن دولة",

  "brand.title": "اليوميات",
  "brand.year": "٢٠٢٦",

  "calendar.title": "التقويم",
  "calendar.subtitle": "اضغط على أي يوم لفتح مهامه. المتتبع يعمل من {start} إلى {end}.",
  "calendar.prevMonth": "الشهر السابق",
  "calendar.nextMonth": "الشهر التالي",
  "calendar.today": "اليوم",
  "calendar.renameDay": "إعادة تسمية هذا اليوم",
  "calendar.quickAdd": "إضافة سريعة لمهمة أو قسم",
  "weekday.sun": "أحد",
  "weekday.mon": "اثن",
  "weekday.tue": "ثلا",
  "weekday.wed": "أرب",
  "weekday.thu": "خمي",
  "weekday.fri": "جمع",
  "weekday.sat": "سبت",

  "status.excellent": "ممتاز",
  "status.veryGood": "جيد جداً",
  "status.okay": "مقبول",
  "status.started": "بدأت",
  "status.empty": "فارغ",

  "day.dayName": "اسم اليوم:",
  "day.tasksOf": "{done} / {total} مهمة",
  "day.noBlocks": "لا توجد كتل بعد. أضف كتلة لتنظيم هذا اليوم.",
  "day.addBlock": "إضافة كتلة",
  "day.addSection": "إضافة قسم",
  "day.addTask": "إضافة مهمة",
  "day.newBlock": "كتلة جديدة",
  "day.newSection": "قسم جديد",
  "day.newTask": "مهمة جديدة",
  "day.untitledBlock": "كتلة بدون عنوان",
  "day.noSections": "لا توجد أقسام بعد.",
  "day.emptyTask": "مهمة فارغة",
  "day.deleteBlock": "حذف الكتلة",
  "day.deleteSection": "حذف القسم",
  "day.deleteTask": "حذف المهمة",
  "day.renameBlock": "إعادة تسمية الكتلة",
  "day.collapseBlock": "طي الكتلة",
  "day.expandBlock": "توسيع الكتلة",
  "day.collapseSection": "طي القسم",
  "day.expandSection": "توسيع القسم",
  "day.dayNote": "📝 كيف كان يومك؟",
  "day.linkedNotes": "الملاحظات المرتبطة",

  "notes.title": "الملاحظات",
  "notes.subtitle": "أفكار وتذكيرات وملاحظات حرة.",
  "notes.new": "ملاحظة جديدة",
  "notes.empty": "لا توجد ملاحظات بعد — أنشئ واحدة.",
  "notes.noMatches": "لا توجد نتائج.",
  "notes.untitled": "ملاحظة بدون عنوان",
  "notes.noContent": "لا يوجد محتوى",
  "notes.lastUpdated": "آخر تحديث {when}",
  "notes.linkedDay": "اليوم المرتبط:",
  "notes.linkPick": "ربط بيوم في التقويم",
  "notes.unlink": "إلغاء الربط",
  "notes.selectOrCreate": "اختر أو أنشئ ملاحظة لتبدأ.",
  "notes.editor.bold": "عريض",
  "notes.editor.italic": "مائل",
  "notes.editor.bullet": "قائمة نقطية",
  "notes.editor.numbered": "قائمة مرقمة",

  "analysis.title": "التحليل",
  "analysis.subtitle": "تتبع تقدمك الشهري والسنوي.",
  "analysis.yearCompletion": "إنجاز السنة",
  "analysis.tasksDone": "{n} مهمة منجزة",
  "analysis.daysTracked": "الأيام المتتبَّعة",
  "analysis.ofN": "من {n}",
  "analysis.currentStreak": "السلسلة الحالية",
  "analysis.bestStreak": "أفضل سلسلة",
  "analysis.daysGte50": "أيام ≥ ٥٠٪",
  "analysis.yearlyProgress": "التقدم السنوي (متوسط ٪ لكل شهر)",
  "analysis.monthly": "تحليل شهري",
  "analysis.avgCompletion": "متوسط الإنجاز",
  "analysis.bestDay": "أفضل يوم",
  "analysis.daysAt50": "أيام ≥ ٥٠٪",
  "analysis.tasksDoneShort": "المهام المنجزة",
  "analysis.dailyCompletion": "الإنجاز اليومي",
  "analysis.byCategory": "حسب الفئة",
  "analysis.taskShare": "حصة المهام حسب الفئة",
  "analysis.completion": "الإنجاز",
  "analysis.day": "اليوم",

  "qa.title": "إضافة سريعة",
  "qa.subtitle": "أضف مهمة أو قسماً كاملاً أو كتلة كاملة ليوم واحد أو نطاق تواريخ أو كل أيام السنة.",
  "qa.tab.task": "مهمة",
  "qa.tab.section": "قسم",
  "qa.tab.block": "كتلة",
  "qa.task": "مهمة",
  "qa.block": "كتلة",
  "qa.section": "قسم",
  "qa.sectionOptional": "القسم (اختياري)",
  "qa.sectionTitle": "عنوان القسم",
  "qa.starterTasks": "المهام الابتدائية (واحدة في كل سطر، اختياري)",
  "qa.blockTitle": "عنوان الكتلة",
  "qa.sections": "الأقسام (واحد في كل سطر — الصيغة:",
  "qa.note": "سيتم إنشاء الكتلة والقسم في كل يوم محدد إذا لم يكونا موجودين.",
  "qa.applyTo": "تطبيق على",
  "qa.allYear": "السنة كاملة",
  "qa.singleDay": "يوم واحد",
  "qa.dateRange": "نطاق تواريخ",
  "qa.date": "التاريخ",
  "qa.start": "البداية",
  "qa.end": "النهاية",
  "qa.allYearNote": "سيتم التطبيق على كل يوم من {start} إلى {end}.",
  "qa.pickDate": "اختر تاريخاً أولاً",
  "qa.taskRequired": "نص المهمة مطلوب",
  "qa.sectionRequired": "عنوان القسم مطلوب",
  "qa.blockRequired": "عنوان الكتلة مطلوب",
  "qa.taskAdded": "تمت إضافة المهمة",
  "qa.sectionAdded": "تمت إضافة القسم",
  "qa.blockCreated": "تم إنشاء الكتلة",
  "qa.appliedTo": "تم التطبيق على {n} يوم.",

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

  "auth.brandSubtitle": "سجّل الدخول لمزامنة سنتك بطريقتك.",
  "auth.tab.login": "تسجيل الدخول",
  "auth.tab.signup": "إنشاء حساب",
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة المرور",
  "auth.confirmPassword": "تأكيد كلمة المرور",
  "auth.name": "الاسم",
  "auth.forgot": "نسيت كلمة المرور؟",
  "auth.remember": "تذكرني على هذا الجهاز",
  "auth.signIn": "تسجيل الدخول",
  "auth.createAccount": "إنشاء حساب",
  "auth.orContinue": "أو تابع باستخدام",
  "auth.continueGoogle": "المتابعة باستخدام Google",
  "auth.terms": "بالمتابعة فإنك توافق على",
  "auth.termsLink": "الشروط",
  "auth.and": "و",
  "auth.privacyLink": "سياسة الخصوصية",
  "auth.reset.title": "إعادة تعيين كلمة المرور",
  "auth.reset.desc": "أدخل بريدك الإلكتروني وسنرسل إليك رابط إعادة التعيين.",
  "auth.reset.send": "إرسال رابط إعادة التعيين",
  "auth.reset.back": "العودة لتسجيل الدخول",
  "auth.reset.sent": "تم إرسال بريد إعادة التعيين — تحقق من صندوق الوارد.",
  "auth.invalidCreds": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "auth.welcomeBack": "مرحباً بعودتك!",
  "auth.created": "تم إنشاء الحساب! تم تسجيل دخولك.",
  "auth.exists": "يوجد حساب بهذا البريد الإلكتروني بالفعل",
  "auth.enterPw": "أدخل كلمة المرور",
  "auth.weakPw": "كلمة المرور لا تستوفي جميع المتطلبات",
  "auth.pwMismatch": "كلمتا المرور غير متطابقتين",
  "auth.pwMatch": "كلمتا المرور متطابقتان",
  "auth.strength": "القوة:",
  "auth.showPw": "إظهار كلمة المرور",
  "auth.hidePw": "إخفاء كلمة المرور",
  "auth.googleFailed": "فشل تسجيل الدخول عبر Google",
  "auth.setNew.title": "تعيين كلمة مرور جديدة",
  "auth.setNew.descReady": "أدخل كلمة مرور قوية لإكمال إعادة تعيين حسابك.",
  "auth.setNew.descNotReady": "افتح رابط إعادة التعيين من بريدك للمتابعة.",
  "auth.setNew.update": "تحديث كلمة المرور",
  "auth.setNew.updated": "تم تحديث كلمة المرور",
};

const DICTS: Record<string, Dict> = { en: EN, ar: AR, ...EXTRA_DICTS };

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  format: (date: Date | number, fmt: string) => string;
  locale: Locale;
  dir: "ltr" | "rtl";
  available: typeof LANGUAGES;
}

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "dt2026:lang";
const VALID_CODES = new Set(LANGUAGES.map((l) => l.code));

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem(STORAGE_KEY) || "";
    return VALID_CODES.has(saved) ? saved : "en";
  });

  const dir: "ltr" | "rtl" = RTL_CODES.has(lang) ? "rtl" : "ltr";
  const locale = useMemo(() => localeFor(lang), [lang]);

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
    (key: string, vars?: Record<string, string | number>) =>
      interpolate(DICTS[lang]?.[key] ?? EN[key] ?? key, vars),
    [lang],
  );
  const format = useCallback(
    (date: Date | number, fmt: string) => tFormat(date, fmt, lang),
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, toggle, t, format, locale, dir, available: LANGUAGES }),
    [lang, setLang, toggle, t, format, locale, dir],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

/** Map a status percent to an i18n key for label rendering. */
export function statusKeyFromPercent(pct: number): string {
  if (pct >= 0.85) return "status.excellent";
  if (pct >= 0.6) return "status.veryGood";
  if (pct >= 0.35) return "status.okay";
  if (pct > 0) return "status.started";
  return "status.empty";
}
