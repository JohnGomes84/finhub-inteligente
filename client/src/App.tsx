import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import EmployeesPage from "./pages/Employees";
import ClientsPage from "./pages/Clients";
import SuppliersPage from "./pages/Suppliers";
import ShiftsPage from "./pages/Shifts";
import FunctionsPage from "./pages/Functions";
import CostCentersPage from "./pages/CostCenters";
import BankAccountsPage from "./pages/BankAccounts";
import AccountsPayablePage from "./pages/AccountsPayable";
import AccountsReceivablePage from "./pages/AccountsReceivable";
import PaymentBatchesPage from "./pages/PaymentBatches";
import UsersPage from "./pages/Users";
import AnalyticsPage from "./pages/Analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">
        <DashboardLayout><Dashboard /></DashboardLayout>
      </Route>
      <Route path="/employees">
        <DashboardLayout><EmployeesPage /></DashboardLayout>
      </Route>
      <Route path="/clients">
        <DashboardLayout><ClientsPage /></DashboardLayout>
      </Route>
      <Route path="/suppliers">
        <DashboardLayout><SuppliersPage /></DashboardLayout>
      </Route>
      <Route path="/shifts">
        <DashboardLayout><ShiftsPage /></DashboardLayout>
      </Route>
      <Route path="/functions">
        <DashboardLayout><FunctionsPage /></DashboardLayout>
      </Route>
      <Route path="/cost-centers">
        <DashboardLayout><CostCentersPage /></DashboardLayout>
      </Route>
      <Route path="/bank-accounts">
        <DashboardLayout><BankAccountsPage /></DashboardLayout>
      </Route>
      <Route path="/accounts-payable">
        <DashboardLayout><AccountsPayablePage /></DashboardLayout>
      </Route>
      <Route path="/accounts-receivable">
        <DashboardLayout><AccountsReceivablePage /></DashboardLayout>
      </Route>
      <Route path="/payment-batches">
        <DashboardLayout><PaymentBatchesPage /></DashboardLayout>
      </Route>
      <Route path="/users">
        <DashboardLayout><UsersPage /></DashboardLayout>
      </Route>
      <Route path="/analytics">
        <DashboardLayout><AnalyticsPage /></DashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
