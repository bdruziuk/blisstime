const CITIES: Array<[string, string[]]> = [
  ["Київ", ["kyiv", "kiev", "киев"]], ["Харків", ["kharkiv", "kharkov", "харьков"]],
  ["Одеса", ["odesa", "odessa", "одесса"]], ["Дніпро", ["dnipro", "dnepr", "днепр"]],
  ["Львів", ["lviv", "lvov", "львов"]], ["Запоріжжя", ["zaporizhzhia", "zaporozhye"]],
  ["Вінниця", ["vinnytsia", "vinnitsa"]], ["Полтава", ["poltava"]],
  ["Чернігів", ["chernihiv", "chernigov"]], ["Черкаси", ["cherkasy", "cherkassy"]],
  ["Житомир", ["zhytomyr", "zhitomir"]], ["Суми", ["sumy", "sumy city"]],
  ["Рівне", ["rivne", "rovno"]], ["Луцьк", ["lutsk"]], ["Тернопіль", ["ternopil"]],
  ["Ужгород", ["uzhhorod", "uzhgorod"]], ["Івано-Франківськ", ["ivano-frankivsk", "ivano frankivsk"]],
  ["Чернівці", ["chernivtsi", "chernovtsy"]], ["Хмельницький", ["khmelnytskyi", "khmelnitsky"]],
  ["Кропивницький", ["kropyvnytskyi", "kirovohrad", "kirovograd"]],
  ["Миколаїв", ["mykolaiv", "nikolaev"]], ["Херсон", ["kherson"]],
  ["Біла Церква", ["bila tserkva", "bila-tserkva"]], ["Бровари", ["brovary", "brovari"]],
  ["Бориспіль", ["boryspil", "borispol"]], ["Буча", ["bucha"]], ["Ірпінь", ["irpin"]],
  ["Кременчук", ["kremenchuk"]], ["Кам’янське", ["kamianske", "kamenskoye"]],
  ["Кривий Ріг", ["kryvyi rih", "krivoy rog"]], ["Маріуполь", ["mariupol"]],
];

const CITY_ALIASES = new Map<string, string>();
function cityKey(value: string) {
  return value
    .split(",")[0]
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/\b(?:city|місто|oblast|область|region)\b/giu, "")
    .replace(/[^a-zа-яіїєґ0-9]+/giu, "");
}

for (const [canonical, aliases] of CITIES) {
  CITY_ALIASES.set(cityKey(canonical), canonical);
  for (const alias of aliases) CITY_ALIASES.set(cityKey(alias), canonical);
}

export function canonicalCityName(name: string, countryCode?: string | null) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return clean;
  if (!countryCode || countryCode.toUpperCase() === "UA") return CITY_ALIASES.get(cityKey(clean)) ?? clean;
  return clean;
}

/** City label safe for the Ukrainian catalog filter. Unknown Latin-only UA values are hidden instead of creating duplicates. */
export function catalogCityName(name: string, countryCode?: string | null): string | null {
  const canonical = canonicalCityName(name, countryCode);
  if ((!countryCode || countryCode.toUpperCase() === "UA") && !/[А-Яа-яІіЇїЄєҐґ]/.test(canonical)) return null;
  return canonical;
}

export function sameCanonicalCity(left: string, right: string, countryCode?: string | null) {
  return canonicalCityName(left, countryCode).toLocaleLowerCase() === canonicalCityName(right, countryCode).toLocaleLowerCase();
}
