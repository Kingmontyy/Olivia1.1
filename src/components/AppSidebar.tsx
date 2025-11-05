import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  GitBranch, 
  PlaySquare, 
  Star, 
  Eye, 
  Settings,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Forecasts", url: "/forecasts", icon: TrendingUp },
  { title: "Scenarios", url: "/scenarios", icon: GitBranch },
  { title: "Playground", url: "/playground", icon: PlaySquare },
  { title: "Favorites", url: "/favorites", icon: Star },
  { title: "Vision", url: "/vision", icon: Eye },
];

const settingsItem = { title: "Settings", url: "/settings", icon: Settings };

export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const location = useLocation();

  return (
    <Sidebar className="border-r sticky top-0 h-screen">
      <SidebarContent className="flex flex-col">
        {/* Toggle button at top-right */}
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            {open ? (
              <ChevronsLeft className="h-4 w-4" />
            ) : (
              <ChevronsRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main items - vertically centered */}
        <SidebarGroup className="flex-1 flex items-center">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {open && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings at bottom */}
        <div className="mt-auto">
          <Separator className="mb-2" />
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === settingsItem.url}
                  >
                    <Link to={settingsItem.url} className="flex items-center gap-3">
                      <settingsItem.icon className="h-5 w-5" />
                      {open && <span>{settingsItem.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
