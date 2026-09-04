import { AuditLogPage } from "@/components/audit-log-page";

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AuditLogPage ideathonId={id} />;
}
