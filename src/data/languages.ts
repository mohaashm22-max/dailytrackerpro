// World languages list. `rtl` true for right-to-left scripts.
// Only `en` and `ar` have full UI translations; others switch locale + direction
// and fall back to English strings.
export interface AppLanguage {
  code: string;
  name: string; // English name
  native: string; // Endonym
  rtl?: boolean;
  flag: string;
}

export const LANGUAGES: AppLanguage[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "ar", name: "Arabic", native: "العربية", rtl: true, flag: "🇸🇦" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩" },
  { code: "ur", name: "Urdu", native: "اردو", rtl: true, flag: "🇵🇰" },
  { code: "fa", name: "Persian", native: "فارسی", rtl: true, flag: "🇮🇷" },
  
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", native: "ไทย", flag: "🇹🇭" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱" },
  { code: "uk", name: "Ukrainian", native: "Українська", flag: "🇺🇦" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
  { code: "no", name: "Norwegian", native: "Norsk", flag: "🇳🇴" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", native: "Suomi", flag: "🇫🇮" },
  { code: "el", name: "Greek", native: "Ελληνικά", flag: "🇬🇷" },
  { code: "cs", name: "Czech", native: "Čeština", flag: "🇨🇿" },
  { code: "ro", name: "Romanian", native: "Română", flag: "🇷🇴" },
  { code: "hu", name: "Hungarian", native: "Magyar", flag: "🇭🇺" },
  { code: "sk", name: "Slovak", native: "Slovenčina", flag: "🇸🇰" },
  { code: "bg", name: "Bulgarian", native: "Български", flag: "🇧🇬" },
  { code: "sr", name: "Serbian", native: "Српски", flag: "🇷🇸" },
  { code: "hr", name: "Croatian", native: "Hrvatski", flag: "🇭🇷" },
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪" },
  { code: "am", name: "Amharic", native: "አማርኛ", flag: "🇪🇹" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ne", name: "Nepali", native: "नेपाली", flag: "🇳🇵" },
  { code: "si", name: "Sinhala", native: "සිංහල", flag: "🇱🇰" },
  { code: "my", name: "Burmese", native: "မြန်မာ", flag: "🇲🇲" },
  { code: "km", name: "Khmer", native: "ខ្មែរ", flag: "🇰🇭" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycanca", flag: "🇦🇿" },
  { code: "kk", name: "Kazakh", native: "Қазақша", flag: "🇰🇿" },
  { code: "uz", name: "Uzbek", native: "Oʻzbekcha", flag: "🇺🇿" },
  { code: "hy", name: "Armenian", native: "Հայերեն", flag: "🇦🇲" },
  { code: "ka", name: "Georgian", native: "ქართული", flag: "🇬🇪" },
  { code: "is", name: "Icelandic", native: "Íslenska", flag: "🇮🇸" },
  { code: "ga", name: "Irish", native: "Gaeilge", flag: "🇮🇪" },
  { code: "cy", name: "Welsh", native: "Cymraeg", flag: "🏴" },
  { code: "af", name: "Afrikaans", native: "Afrikaans", flag: "🇿🇦" },
  { code: "zu", name: "Zulu", native: "isiZulu", flag: "🇿🇦" },
  { code: "yo", name: "Yoruba", native: "Yorùbá", flag: "🇳🇬" },
  { code: "ha", name: "Hausa", native: "Hausa", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", native: "Igbo", flag: "🇳🇬" },
  { code: "tl", name: "Filipino", native: "Filipino", flag: "🇵🇭" },
];

export const RTL_CODES = new Set(LANGUAGES.filter((l) => l.rtl).map((l) => l.code));

export function findLanguage(code: string): AppLanguage | undefined {
  return LANGUAGES.find((l) => l.code === code);
}
