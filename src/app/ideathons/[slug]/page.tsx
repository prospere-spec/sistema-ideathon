import { PublicIdeathonPage } from "./public-ideathon-page";

type PageProps = { params: Promise<{ slug: string }> };

export default async function IdeathonPage({ params }: PageProps) {
  const { slug } = await params;
  return <PublicIdeathonPage slug={slug} />;
}
