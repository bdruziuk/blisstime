// Fixed beauty verticals shown in the homepage category grid and the header
// mega-menu. Structured so other verticals (auto, health, tutoring) can be
// added later, but for now the product is beauty-only (see CLAUDE.md).
export type Vertical = { slug: string; name: string; emoji: string; blurb: string };

export const VERTICALS: Vertical[] = [
  { slug: "hair", name: "Перукарі та барбери", emoji: "💇‍♀️", blurb: "Стрижки, колористика, догляд" },
  { slug: "nails", name: "Манікюр та педикюр", emoji: "💅", blurb: "Манікюр, педикюр, нігтьовий дизайн" },
  { slug: "brows", name: "Брови", emoji: "🪮", blurb: "Корекція, ламінування, фарбування" },
  { slug: "lashes", name: "Вії", emoji: "👁️", blurb: "Нарощування, ламінування" },
  { slug: "cosmetology", name: "Косметологія", emoji: "✨", blurb: "Чистка, догляд за обличчям" },
  { slug: "massage", name: "Масаж та SPA", emoji: "💆‍♀️", blurb: "Оздоровчі та розслаблюючі процедури" },
  { slug: "tattoo", name: "Татуаж", emoji: "🖋️", blurb: "Перманентний макіяж" },
];
