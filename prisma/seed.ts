import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const tree = [
  {
    slug: "nails",
    name: "Нігті",
    children: [
      { slug: "nails.manicure.classic", name: "Манікюр (класичний)" },
      { slug: "nails.manicure.gel", name: "Манікюр (гель-лак)" },
      { slug: "nails.pedicure", name: "Педикюр" },
    ],
  },
  {
    slug: "brows",
    name: "Брови",
    children: [
      { slug: "brows.correction", name: "Корекція брів" },
      { slug: "brows.lamination", name: "Ламінування брів" },
    ],
  },
  {
    slug: "lashes",
    name: "Вії",
    children: [
      { slug: "lashes.extension.classic", name: "Нарощування вій (класика)" },
      { slug: "lashes.extension.volume", name: "Нарощування вій (об'єм)" },
    ],
  },
  {
    slug: "hair",
    name: "Волосся",
    children: [
      { slug: "hair.haircut", name: "Стрижка" },
      { slug: "hair.coloring", name: "Фарбування" },
    ],
  },
  {
    slug: "tattoo",
    name: "Татуаж",
    children: [{ slug: "tattoo.permanent_brows", name: "Перманентний макіяж брів" }],
  },
  {
    slug: "cosmetology",
    name: "Косметологія",
    children: [{ slug: "cosmetology.facial", name: "Чистка обличчя" }],
  },
  {
    slug: "massage",
    name: "Масаж",
    children: [{ slug: "massage.relax", name: "Розслаблюючий масаж" }],
  },
];

async function main() {
  for (const parent of tree) {
    const created = await prisma.serviceCategory.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name },
      create: { slug: parent.slug, name: parent.name },
    });

    for (const child of parent.children) {
      await prisma.serviceCategory.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: created.id },
        create: { slug: child.slug, name: child.name, parentId: created.id },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
