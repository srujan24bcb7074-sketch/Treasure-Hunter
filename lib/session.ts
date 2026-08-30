import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getCurrentTeam() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hunt_session")?.value;
  if (!token) return null;

  return prisma.team.findUnique({
    where: { sessionToken: token },
    include: { members: true },
  });
}
