const CITY_ALIASES: Record<string, string> = {
  kyiv: "Київ", kiev: "Київ", "київ": "Київ", "киев": "Київ",
  kharkiv: "Харків", kharkov: "Харків", "харків": "Харків", "харьков": "Харків",
  odesa: "Одеса", odessa: "Одеса", "одеса": "Одеса", "одесса": "Одеса",
  dnipro: "Дніпро", dnepr: "Дніпро", "дніпро": "Дніпро", "днепр": "Дніпро",
  lviv: "Львів", lvov: "Львів", "львів": "Львів", "львов": "Львів",
  zaporizhzhia: "Запоріжжя", zaporozhye: "Запоріжжя", "запоріжжя": "Запоріжжя",
  vinnytsia: "Вінниця", vinnitsa: "Вінниця", "вінниця": "Вінниця",
  poltava: "Полтава", "полтава": "Полтава",
  chernihiv: "Чернігів", chernigov: "Чернігів", "чернігів": "Чернігів",
  cherkasy: "Черкаси", cherkassy: "Черкаси", "черкаси": "Черкаси",
};

export function canonicalCityName(name: string, countryCode?: string | null) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return clean;
  if (!countryCode || countryCode.toUpperCase() === "UA") return CITY_ALIASES[clean.toLocaleLowerCase()] ?? clean;
  return clean;
}

export function sameCanonicalCity(left: string, right: string, countryCode?: string | null) {
  return canonicalCityName(left, countryCode).toLocaleLowerCase() === canonicalCityName(right, countryCode).toLocaleLowerCase();
}
