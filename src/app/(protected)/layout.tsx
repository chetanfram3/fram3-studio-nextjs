// src/app/(protected)/layout.tsx
import { Header } from "@/components/header/Header";
import { AuthGuard } from "@/components/auth";
import { SidebarProvider, Sidebar } from "@/components/sidebar";
import { Box } from "@mui/material";

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
      <SidebarProvider>
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            bgcolor: "background.default",
          }}
        >
          {/* Sidebar Component */}
          <Sidebar />

          {/* Main Content Area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              width: "100%",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <Header />

            {/* Page Content */}
            <Box
              sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3, md: 4 },
                mt: 8, // Account for fixed header height
                overflow: "auto",
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </SidebarProvider>
    </AuthGuard>
  );
}
