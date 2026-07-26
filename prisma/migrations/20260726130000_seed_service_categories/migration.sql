-- Seed the fixed beauty service taxonomy as part of migrations, so a fresh
-- production database (Railway) has categories without a separate seed step.
-- Idempotent: ON CONFLICT (slug) DO NOTHING makes it safe to re-run and safe
-- on databases already seeded via prisma/seed.ts.

-- Top-level categories.
INSERT INTO "ServiceCategory" ("id", "slug", "name", "parentId") VALUES
  (gen_random_uuid()::text, 'nails',       'Нігті',        NULL),
  (gen_random_uuid()::text, 'brows',       'Брови',        NULL),
  (gen_random_uuid()::text, 'lashes',      'Вії',          NULL),
  (gen_random_uuid()::text, 'hair',        'Волосся',      NULL),
  (gen_random_uuid()::text, 'tattoo',      'Татуаж',       NULL),
  (gen_random_uuid()::text, 'cosmetology', 'Косметологія', NULL),
  (gen_random_uuid()::text, 'massage',     'Масаж',        NULL),
  (gen_random_uuid()::text, 'misc',        'Інше',         NULL)
ON CONFLICT ("slug") DO NOTHING;

-- Leaf categories, linked to their parent by slug.
INSERT INTO "ServiceCategory" ("id", "slug", "name", "parentId")
SELECT gen_random_uuid()::text, v.slug, v.name, p.id
FROM (VALUES
  ('nails.manicure.classic',   'Манікюр (класичний)',           'nails'),
  ('nails.manicure.gel',       'Манікюр (гель-лак)',            'nails'),
  ('nails.pedicure',           'Педикюр',                       'nails'),
  ('brows.correction',         'Корекція брів',                 'brows'),
  ('brows.lamination',         'Ламінування брів',              'brows'),
  ('lashes.extension.classic', 'Нарощування вій (класика)',     'lashes'),
  ('lashes.extension.volume',  'Нарощування вій (об''єм)',      'lashes'),
  ('hair.haircut',             'Стрижка',                       'hair'),
  ('hair.coloring',            'Фарбування',                    'hair'),
  ('tattoo.permanent_brows',   'Перманентний макіяж брів',      'tattoo'),
  ('cosmetology.facial',       'Чистка обличчя',                'cosmetology'),
  ('massage.relax',            'Розслаблюючий масаж',           'massage'),
  ('misc.other',               'Інше',                          'misc')
) AS v(slug, name, parent_slug)
JOIN "ServiceCategory" p ON p.slug = v.parent_slug
ON CONFLICT ("slug") DO NOTHING;
