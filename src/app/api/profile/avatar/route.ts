import { NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Необхідно увійти" }, { status: 401 });
  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id }, select: { id: true, username: true } });
  if (!staff) return NextResponse.json({ error: "Профіль не знайдено" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Оберіть фото" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Максимальний розмір фото — 5 МБ" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Підтримуються JPG, PNG, WebP та AVIF" }, { status: 400 });

  try {
    const processed = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(512, 512, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
    const data = Uint8Array.from(processed);
    await prisma.staffAvatar.upsert({
      where: { staffId: staff.id },
      create: { staffId: staff.id, data, mimeType: "image/webp" },
      update: { data, mimeType: "image/webp" },
    });
    return NextResponse.json({ avatarUrl: `/api/avatar/${encodeURIComponent(staff.username)}?v=${Date.now()}` });
  } catch {
    return NextResponse.json({ error: "Не вдалося обробити фото" }, { status: 400 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Необхідно увійти" }, { status: 401 });
  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!staff) return NextResponse.json({ error: "Профіль не знайдено" }, { status: 404 });
  await prisma.staffAvatar.deleteMany({ where: { staffId: staff.id } });
  return NextResponse.json({ ok: true });
}
