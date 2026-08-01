export const BEAUTY_IMPORT_CATEGORIES = [
  {
    key: "BEAUTY_SALON",
    label: "Салони краси",
    providerTypes: ["beauty_salon"],
    searchQueries: ["салон краси", "студія краси"],
  },
  {
    key: "HAIR_SALON",
    label: "Перукарні",
    providerTypes: ["hair_salon"],
    searchQueries: ["перукарня", "студія волосся"],
  },
  {
    key: "NAIL_SALON",
    label: "Манікюр і педикюр",
    providerTypes: ["nail_salon"],
    searchQueries: ["манікюр", "педикюр", "студія нігтів"],
  },
  {
    key: "BARBER",
    label: "Барбершопи",
    providerTypes: ["barber_shop"],
    searchQueries: ["барбершоп"],
  },
  {
    key: "SPA",
    label: "SPA і wellness",
    providerTypes: ["spa"],
    searchQueries: ["SPA", "wellness"],
  },
  {
    key: "COSMETOLOGY",
    label: "Косметологія",
    providerTypes: ["skin_care_clinic"],
    searchQueries: ["косметологія", "косметологічний центр"],
  },
  {
    key: "MAKEUP",
    label: "Макіяж",
    providerTypes: ["makeup_artist"],
    searchQueries: ["візажист", "студія макіяжу"],
  },
  {
    key: "MASSAGE",
    label: "Масаж",
    providerTypes: [],
    searchQueries: ["масажний салон", "масаж"],
  },
  {
    key: "BROWS_LASHES",
    label: "Брови та вії",
    providerTypes: [],
    searchQueries: ["студія брів", "студія вій", "brow bar", "lash studio"],
  },
  {
    key: "HAIR_REMOVAL",
    label: "Депіляція та лазерна епіляція",
    providerTypes: [],
    searchQueries: ["лазерна епіляція", "депіляція", "шугаринг"],
  },
] as const;

export type BeautyImportCategoryKey = (typeof BEAUTY_IMPORT_CATEGORIES)[number]["key"];

export const BEAUTY_IMPORT_CATEGORY_KEYS = BEAUTY_IMPORT_CATEGORIES.map(
  (category) => category.key
) as [BeautyImportCategoryKey, ...BeautyImportCategoryKey[]];

export function getImportCategory(key: string) {
  return BEAUTY_IMPORT_CATEGORIES.find((category) => category.key === key);
}
