import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingChat } from "@/components/FloatingChat";
import { Menu } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 sticky top-0 bg-background z-40">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <FloatingChat />
    </SidebarProvider>
  );
};
