import { RoomManagementPage } from "@/components/room-management-page";

export default async function RoomsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoomManagementPage ideathonId={id} />;
}
