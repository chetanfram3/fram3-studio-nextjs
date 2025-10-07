import { Header } from "@/components/header/Header";
import { AuthGuard } from "@/components/auth";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard
      requireAuth={true}
      redirectTo="/signin"
      loadingText="Checking authentication..."
    >
      <div className="min-h-screen bg-background">
        <Header />
        <main>{children}</main>
      </div>
    </AuthGuard>
  );
}
