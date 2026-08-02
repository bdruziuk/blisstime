import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const avatar = await prisma.staffAvatar.findFirst({
    where: { staff: { username, onboardedAt: { not: null } } },
    select: { data: true, mimeType: true, updatedAt: true },
  });
  if (!avatar) return new Response(null, { status: 404 });
  return new Response(avatar.data, {
    headers: {
      "Content-Type": avatar.mimeType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      ETag: `"${avatar.updatedAt.getTime()}"`,
    },
  });
}
