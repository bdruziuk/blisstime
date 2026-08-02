export const UKRAINE_REGIONAL_CENTERS = [
  { city: "Вінниця", lat: 49.2331, lng: 28.4682 },
  { city: "Луцьк", lat: 50.7472, lng: 25.3254 },
  { city: "Дніпро", lat: 48.4647, lng: 35.0462 },
  { city: "Донецьк", lat: 48.0159, lng: 37.8028 },
  { city: "Житомир", lat: 50.2547, lng: 28.6587 },
  { city: "Ужгород", lat: 48.6208, lng: 22.2879 },
  { city: "Запоріжжя", lat: 47.8388, lng: 35.1396 },
  { city: "Івано-Франківськ", lat: 48.9226, lng: 24.7111 },
  { city: "Київ", lat: 50.4501, lng: 30.5234 },
  { city: "Кропивницький", lat: 48.5079, lng: 32.2623 },
  { city: "Луганськ", lat: 48.574, lng: 39.3078 },
  { city: "Львів", lat: 49.8397, lng: 24.0297 },
  { city: "Миколаїв", lat: 46.975, lng: 31.9946 },
  { city: "Одеса", lat: 46.4825, lng: 30.7233 },
  { city: "Полтава", lat: 49.5883, lng: 34.5514 },
  { city: "Рівне", lat: 50.6199, lng: 26.2516 },
  { city: "Суми", lat: 50.9077, lng: 34.7981 },
  { city: "Тернопіль", lat: 49.5535, lng: 25.5948 },
  { city: "Харків", lat: 49.9935, lng: 36.2304 },
  { city: "Херсон", lat: 46.6354, lng: 32.6169 },
  { city: "Хмельницький", lat: 49.4229, lng: 26.9871 },
  { city: "Черкаси", lat: 49.4444, lng: 32.0598 },
  { city: "Чернівці", lat: 48.2915, lng: 25.9403 },
  { city: "Чернігів", lat: 51.4982, lng: 31.2893 },
] as const;

export function nearestRegionalCenter(lat: number, lng: number) {
  return UKRAINE_REGIONAL_CENTERS.reduce((nearest, center) => {
    const scale = Math.cos((lat * Math.PI) / 180);
    const distance = (center.lat - lat) ** 2 + ((center.lng - lng) * scale) ** 2;
    return distance < nearest.distance ? { city: center.city, distance } : nearest;
  }, { city: UKRAINE_REGIONAL_CENTERS[0].city as string, distance: Number.POSITIVE_INFINITY }).city;
}

const REGION_TO_CENTER = new Map([
  ["вінницька", "Вінниця"], ["волинська", "Луцьк"], ["дніпропетровська", "Дніпро"],
  ["донецька", "Донецьк"], ["житомирська", "Житомир"], ["закарпатська", "Ужгород"],
  ["запорізька", "Запоріжжя"], ["івано-франківська", "Івано-Франківськ"], ["київська", "Київ"],
  ["кіровоградська", "Кропивницький"], ["луганська", "Луганськ"], ["львівська", "Львів"],
  ["миколаївська", "Миколаїв"], ["одеська", "Одеса"], ["полтавська", "Полтава"],
  ["рівненська", "Рівне"], ["сумська", "Суми"], ["тернопільська", "Тернопіль"],
  ["харківська", "Харків"], ["херсонська", "Херсон"], ["хмельницька", "Хмельницький"],
  ["черкаська", "Черкаси"], ["чернівецька", "Чернівці"], ["чернігівська", "Чернігів"],
  ["vinnytsia", "Вінниця"], ["volyn", "Луцьк"], ["dnipropetrovsk", "Дніпро"],
  ["donetsk", "Донецьк"], ["zhytomyr", "Житомир"], ["zakarpattia", "Ужгород"],
  ["zaporizhzhia", "Запоріжжя"], ["ivano-frankivsk", "Івано-Франківськ"], ["kyiv", "Київ"],
  ["kirovohrad", "Кропивницький"], ["luhansk", "Луганськ"], ["lviv", "Львів"],
  ["mykolaiv", "Миколаїв"], ["odesa", "Одеса"], ["poltava", "Полтава"],
  ["rivne", "Рівне"], ["sumy", "Суми"], ["ternopil", "Тернопіль"],
  ["kharkiv", "Харків"], ["kherson", "Херсон"], ["khmelnytskyi", "Хмельницький"],
  ["cherkasy", "Черкаси"], ["chernivtsi", "Чернівці"], ["chernihiv", "Чернігів"],
]);

export function regionalCenterFromRegion(region: string | null | undefined): string | null {
  if (!region) return null;
  const key = region
    .toLocaleLowerCase("uk")
    .replace(/[’']/g, "")
    .replace(/(?:\s+область|\s+обл\.?|\s+oblast|\s+region)$/iu, "")
    .trim();
  return REGION_TO_CENTER.get(key) ?? null;
}
