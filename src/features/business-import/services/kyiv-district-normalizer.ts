import { slugify } from "@/lib/slugify";

const DISTRICTS = [
  ["Голосіївський", ["holosiivskyi", "holosiivsky", "голосіївський", "голосеевский"]],
  ["Дарницький", ["darnytskyi", "darnytsky", "дарницький", "дарницкий"]],
  ["Деснянський", ["desnianskyi", "desnyanskyi", "деснянський", "деснянский"]],
  ["Дніпровський", ["dniprovskyi", "dniprovsky", "дніпровський", "днепровский"]],
  ["Оболонський", ["obolonskyi", "obolonsky", "оболонський", "оболонский"]],
  ["Печерський", ["pecherskyi", "pechersky", "печерський", "печерский"]],
  ["Подільський", ["podilskyi", "podilsky", "подільський", "подольский"]],
  ["Святошинський", ["sviatoshynskyi", "svyatoshynsky", "святошинський", "святошинский"]],
  ["Солом’янський", ["solomianskyi", "solomyansky", "солом’янський", "соломянский"]],
  ["Шевченківський", ["shevchenkivskyi", "shevchenkivsky", "шевченківський", "шевченковский"]],
] as const;

const aliases = new Map<string, string>();
for (const [canonical, names] of DISTRICTS) {
  aliases.set(slugify(canonical), canonical);
  for (const name of names) aliases.set(slugify(name), canonical);
}

export function canonicalKyivDistrict(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = value.replace(/\b(?:district|raion)\b/gi, "").replace(/район/gi, "").trim();
  return aliases.get(slugify(clean)) ?? null;
}

export function sameKyivDistrict(left: string | null | undefined, right: string | null | undefined) {
  const a = canonicalKyivDistrict(left);
  const b = canonicalKyivDistrict(right);
  return Boolean(a && b && a === b);
}
