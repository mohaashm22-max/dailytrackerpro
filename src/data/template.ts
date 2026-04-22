// Auto-generated from Daily_Tracker_Final_2026.xlsb
export interface TaskGroup { title: string; tasks: string[]; }
export interface Category { id: string; title: string; groups: TaskGroup[]; }

// Workout name rotation (from Year Tracker sheet, starts April 16, 2026)
export const WORKOUT_ROTATION = [
  "🦵 Legs & Core",
  "🤸 Skill Day",
  "⚡ Conditioning",
  "🌊 Active Recovery",
  "😴 Rest Day",
  "💪 Push Day",
  "🏋️ Pull Day",
];

export const WORKOUT_GROUPS: TaskGroup[] = [
  {
    "title": "WARM-UP",
    "tasks": [
      "Hip circles 30s each direction",
      "Leg swings 15 reps each leg",
      "Glute bridges 15 reps"
    ]
  },
  {
    "title": "STRENGTH",
    "tasks": [
      "Pistol Squats 4×5 each leg",
      "Bulgarian Split Squats 3×10",
      "Nordic Hamstring Curls 3×6",
      "Calf Raises (single leg) 3×15"
    ]
  },
  {
    "title": "CORE",
    "tasks": [
      "L-sit Hold 4×15s",
      "Dragon Flag Negatives 3×5",
      "Hollow Body Hold 3×30s",
      "V-ups 3×12"
    ]
  },
  {
    "title": "FINISHER",
    "tasks": [
      "Plank variations 3×30s",
      "Ab wheel rollouts 3×8"
    ]
  }
];

export const COMMON_CATEGORIES: Category[] = [
  {
    id: "cat",
    title: "🕌 الصلوات الخمس",
    groups: [
        {
            "title": "الفجر",
            "tasks": [
                "أداء صلاة الفجر في وقتها",
                "قراءة أذكار الصباح (15 دقيقة)",
                "قراءة ورد الفجر القرآني"
            ]
        },
        {
            "title": "الظهر",
            "tasks": [
                "أداء صلاة الظهر في وقتها",
                "أداء السنه"
            ]
        },
        {
            "title": "العصر",
            "tasks": [
                "أداء صلاة العصر في وقتها"
            ]
        },
        {
            "title": "المغرب",
            "tasks": [
                "أداء صلاة المغرب في وقتها",
                "أداء السنه",
                "قراءة أذكار المساء (15 دقيقة)"
            ]
        },
        {
            "title": "العشاء",
            "tasks": [
                "أداء صلاة العشاء في وقتها"
            ]
        }
    ],
  },
  {
    id: "cat",
    title: "📚 المذاكرة",
    groups: [
        {
            "title": "جلسة الصباح (2 ساعة)",
            "tasks": [
                "دراسة المادة الأصعب أولاً",
                "حل تمارين ومسائل",
                "تلخيص ما تم مراجعته"
            ]
        },
        {
            "title": "جلسة الظهر (2 ساعة)",
            "tasks": [
                "دراسة ماده جديده",
                "حل تمارين ومسائل",
                "تلخيص ما تم مراجعته"
            ]
        },
        {
            "title": "جلسة المساء (1.5 ساعة)",
            "tasks": [
                "دراسه ماده جديده",
                "حل أسئلة امتحانات سابقة",
                "تلخيص ما تم مراجعته"
            ]
        }
    ],
  },
  {
    id: "cat",
    title: "📕 القراءة",
    groups: [
        {
            "title": "القراءة اليومية",
            "tasks": [
                "قراءة لا تقل عن 20 صفحة",
                "تسجيل الأفكار الرئيسية والاقتباسات"
            ]
        }
    ],
  },
  {
    id: "cat",
    title: "♟️ الشطرنج",
    groups: [
        {
            "title": "التدريب اليومي",
            "tasks": [
                "حل 10 أحجيات تكتيكية (Tactics) على Lichess",
                "مراجعة Opening لمدة 10 دقائق",
                "لعب جيمين مقيمين"
            ]
        },
        {
            "title": "التحليل والتعلم",
            "tasks": [
                "مشاهدة درس شطرنج واحد على YouTube",
                "تحليل الجيمين ومراجعتهم"
            ]
        }
    ],
  },
  {
    id: "english-study",
    title: "English Study",
    groups: [
        {
            "title": "Vocabulary",
            "tasks": [
                "Review yesterday's words (Spaced Repetition)",
                "Use new words in sentences (write them down)"
            ]
        },
        {
            "title": "Grammar & Writing",
            "tasks": [
                "Write a short paragraph (5-7 sentences)"
            ]
        },
        {
            "title": "Listening & Speaking",
            "tasks": [
                "Watch/listen to English content 20 minutes",
                "Shadow a native speaker for 5 minutes (repeat after them)",
                "Record yourself speaking for 1 minute on any topic"
            ]
        },
        {
            "title": "Reading",
            "tasks": [
                "Read an English article or book page for 15 minutes",
                "Note down unfamiliar vocabulary"
            ]
        }
    ],
  },
  {
    id: "cat",
    title: "النظام الغذائي",
    groups: [
        {
            "title": "الوجبات الرئيسية",
            "tasks": [
                "الفطار: 2 سندوتش + 2 بيض",
                "الغداء: بروتين + خضار + كارب",
                "العشاء: زبادي + 2 سندوتش"
            ]
        },
        {
            "title": "الوجبات الخفيفة",
            "tasks": [
                "قبل التمرين:  تمر + ماء (30 دقيقة قبل)",
                "بعد التمرين: وجبه شوفان (خلال ساعة)"
            ]
        },
        {
            "title": "الماء والمكملات",
            "tasks": [
                "شرب 3 لتر ماء على الأقل طوال اليوم",
                "دواء المعده (مع الفطار)",
                "1 قهوه",
                "ما لا يزيد عن 1 نسكافيه او شاي"
            ]
        }
    ],
  },
  {
    id: "cat",
    title: "الاهتمام بالنفس",
    groups: [
        {
            "title": "",
            "tasks": [
                "شاور ساقع",
                "اهتمام بالشعر"
            ]
        }
    ],
  },
  {
    id: "cat",
    title: "الاستيقاذ و النوم",
    groups: [
        {
            "title": "",
            "tasks": [
                "الاستيقاظ 5 فجرا",
                "النوم 10 مساء"
            ]
        }
    ],
  },
];

export const TRACKER_START = '2026-01-01'; // YYYY-MM-DD
export const TRACKER_END = '2026-12-31';
// Anchor for the 7-day workout rotation (matches the original Excel sheet)
export const WORKOUT_ROTATION_ANCHOR = '2026-04-16';
