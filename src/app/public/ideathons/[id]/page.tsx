import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import { ideathons } from "@/db/schema";

type PageProps = { params: Promise<{ id: string }> };

export default async function LegacyPublicIdeathonPage({ params }: PageProps) {
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    notFound();
  const [event] = await getDb()
    .select({ slug: ideathons.slug })
    .from(ideathons)
    .where(eq(ideathons.id, id))
    .limit(1);

  if (!event) notFound();
  redirect(`/ideathons/${encodeURIComponent(event.slug)}`);
}
