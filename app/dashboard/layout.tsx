import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Get user from Clerk auth
  const mockUser = {
    name: "Creator",
    email: "creator@example.com",
    tier: "HUSTLER" as const,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar user={mockUser} />
      <div className="pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
