import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, Users, Building2, Truck, Clock, Briefcase,
  Landmark, CreditCard, Receipt, Wallet, BarChart3, Shield,
  LogOut, PanelLeft, ChevronDown, CircleDollarSign, Settings,
  CalendarDays, UserCheck, Key,
} from "lucide-react";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "./ui/badge";

type MenuItem = {
  icon: any;
  label: string;
  path: string;
  module: string;
  group: string;
};

const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", module: "dashboard", group: "Principal" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", module: "analytics", group: "Principal" },
  { icon: Users, label: "Funcionários", path: "/employees", module: "employees", group: "Cadastros" },
  { icon: Building2, label: "Clientes", path: "/clients", module: "clients", group: "Cadastros" },
  { icon: Truck, label: "Fornecedores", path: "/suppliers", module: "suppliers", group: "Cadastros" },
  { icon: Briefcase, label: "Funções", path: "/functions", module: "functions", group: "Cadastros" },
  { icon: Clock, label: "Turnos", path: "/shifts", module: "shifts", group: "Cadastros" },
  { icon: Settings, label: "Centros de Custo", path: "/cost-centers", module: "cost_centers", group: "Cadastros" },
  { icon: Landmark, label: "Contas Bancárias", path: "/bank-accounts", module: "bank_accounts", group: "Cadastros" },
  { icon: CalendarDays, label: "Planejamentos", path: "/schedules", module: "schedules", group: "Operações" },
  { icon: UserCheck, label: "Portal do Líder", path: "/leader-portal", module: "schedules", group: "Operações" },
  { icon: Key, label: "Aprovação PIX", path: "/pix-approvals", module: "users", group: "Admin" },
  { icon: CreditCard, label: "Contas a Pagar", path: "/accounts-payable", module: "accounts_payable", group: "Financeiro" },
  { icon: Receipt, label: "Contas a Receber", path: "/accounts-receivable", module: "accounts_receivable", group: "Financeiro" },
  { icon: Wallet, label: "Lotes de Pagamento", path: "/payment-batches", module: "payment_batches", group: "Financeiro" },
  { icon: Shield, label: "Usuários", path: "/users", module: "users", group: "Admin" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <CircleDollarSign className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">FinHub</h1>
                <p className="text-xs text-muted-foreground">ML Serviços</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm mt-4">
              Sistema de Gestão Financeira. Faça login para acessar o painel.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Fetch user permissions to filter menu
  const { data: permissions } = trpc.usuarios.myPermissions.useQuery();

  const visibleMenuItems = useMemo(() => {
    if (!permissions) return allMenuItems; // Show all while loading
    return allMenuItems.filter(item => {
      const perm = permissions[item.module as keyof typeof permissions];
      return perm?.canView === true;
    });
  }, [permissions]);

  const groups = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    for (const item of visibleMenuItems) {
      if (!grouped[item.group]) grouped[item.group] = [];
      grouped[item.group].push(item);
    }
    return grouped;
  }, [visibleMenuItems]);

  const activeMenuItem = visibleMenuItems.find(item => item.path === location);
  const [pixPendingCount, setPixPendingCount] = useState(0);

  // Conectar ao stream de notificacoes
  useNotifications((notification) => {
    if (notification.type === "pix_request_created") {
      setPixPendingCount(prev => prev + 1);
    } else if (notification.type === "pix_request_reviewed") {
      setPixPendingCount(prev => Math.max(0, prev - 1));
    }
  });

  // Buscar contagem inicial de PIX pendentes
  const { data: pixRequests } = trpc.portalLider.listPixRequests.useQuery(
    { status: "pendente" },
    { enabled: user?.role === "admin" }
  );

  useEffect(() => {
    if (pixRequests) {
      setPixPendingCount(pixRequests.length);
    }
  }, [pixRequests]);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-border/50">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <CircleDollarSign className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-sm tracking-tight block truncate">FinHub</span>
                    <span className="text-[10px] text-muted-foreground block truncate">ML Serviços</span>
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            {Object.entries(groups).map(([groupName, items]) => (
              <div key={groupName} className="mb-1">
                {!isCollapsed && (
                  <div className="px-4 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {groupName}
                    </span>
                  </div>
                )}
                <SidebarMenu className="px-2">
                  {items.map(item => {
                    const isActive = location === item.path;
                    const showBadge = item.path === "/pix-approvals" && pixPendingCount > 0;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-9 transition-all font-normal text-[13px] ${
                            isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                          <span className="flex-1">{item.label}</span>
                          {showBadge && (
                            <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center text-xs font-bold">
                              {pixPendingCount}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "Usuário"}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {user?.role === "admin" ? "Administrador" : "Usuário"}
                    </p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <span className="text-sm font-medium">{activeMenuItem?.label ?? "Menu"}</span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
