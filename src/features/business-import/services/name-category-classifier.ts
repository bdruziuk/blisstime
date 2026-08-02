import type { BeautyImportCategoryKey } from "../config/categories";

const RULES: Array<{ category: BeautyImportCategoryKey; keywords: string[] }> = [
  {
    category: "NAIL_SALON",
    keywords: ["манікюр", "педикюр", "нігт", "ногт", "гель-лак", "гель лак", "manicure", "pedicure", "nail", "нейл"],
  },
  {
    category: "BARBER",
    keywords: ["барбер", "barber", "barbershop", "barber shop", "чоловіча перукарня", "мужская парикмахерская", "men's haircut", "mens haircut"],
  },
  {
    category: "HAIR_SALON",
    keywords: ["перукар", "волос", "зачіск", "стриж", "фарбування", "укладка", "колорист", "блонд", "кератин", "парикмах", "прическ", "окрашиван", "hair", "hairstyl", "haircut", "hairdresser", "colorist", "blond", "keratin"],
  },
  {
    category: "BROWS_LASHES",
    keywords: ["бров", "бровіст", "бровист", "вій", "ресниц", "лешмейкер", "ламімейкер", "brow", "eyebrow", "lash", "eyelash", "lashmaker", "lamimaker"],
  },
  {
    category: "COSMETOLOGY",
    keywords: ["косметолог", "косметологія", "косметология", "естетичн", "эстетическ", "чистка обличчя", "чистка лица", "пілінг", "пилинг", "cosmetolog", "aesthetic medicine", "skin care", "skincare", "facial", "anti-age", "anti age"],
  },
  {
    category: "MASSAGE",
    keywords: ["масаж", "масажист", "массаж", "массажист", "massage", "massage therapist"],
  },
  {
    category: "MAKEUP",
    keywords: ["макіяж", "візаж", "візажист", "макияж", "визаж", "визажист", "гример", "makeup", "make-up", "make up", "makeup artist", "mua"],
  },
  {
    category: "HAIR_REMOVAL",
    keywords: ["епіляц", "эпиляц", "депіляц", "депиляц", "шугар", "ваксинг", "електроепіляц", "электроэпиляц", "лазерне видалення волосся", "лазерное удаление волос", "hair removal", "sugaring", "waxing", "epilation", "depilation", "electrolysis"],
  },
  {
    category: "SPA",
    keywords: ["спа", "spa", "wellness", "велнес", "велнесс", "relax center", "relax centre"],
  },
  {
    category: "BEAUTY_SALON",
    keywords: ["салон краси", "студія краси", "б'юті", "бьюті", "центр краси", "простір краси", "beauty salon", "beauty studio", "beauty bar", "beauty room", "beauty space", "beauty center", "beauty centre"],
  },
];

function normalizedName(name: string) {
  return name.normalize("NFKC").toLocaleLowerCase("uk").replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}

const WHOLE_WORD_KEYWORDS = new Set(["spa", "спа", "mua"]);

function containsKeyword(name: string, keyword: string) {
  if (WHOLE_WORD_KEYWORDS.has(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, "u").test(name);
  }
  return name.includes(keyword);
}

export function categoriesFromBusinessName(name: string): BeautyImportCategoryKey[] {
  const normalized = normalizedName(name);
  return RULES.filter((rule) => rule.keywords.some((keyword) => containsKeyword(normalized, keyword))).map((rule) => rule.category);
}

export function mergeNameCategories(name: string, categories: string[]): string[] {
  return [...new Set([...categories, ...categoriesFromBusinessName(name)])];
}

export const PUBLIC_CATEGORY_IMPORT_KEYS: Record<string, BeautyImportCategoryKey[]> = {
  nails: ["NAIL_SALON"],
  hair: ["HAIR_SALON", "BARBER"],
  brows: ["BROWS_LASHES"],
  lashes: ["BROWS_LASHES"],
  cosmetology: ["COSMETOLOGY"],
  massage: ["MASSAGE"],
};

export function publicCategorySlugs(categories: unknown): string[] {
  if (!Array.isArray(categories)) return [];
  const assigned = new Set(categories.filter((value): value is string => typeof value === "string"));
  return Object.entries(PUBLIC_CATEGORY_IMPORT_KEYS)
    .filter(([, keys]) => keys.some((key) => assigned.has(key)))
    .map(([slug]) => slug);
}
