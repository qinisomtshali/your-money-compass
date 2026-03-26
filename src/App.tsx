import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";
import Savings from "./pages/Savings";
import SavingsChallenges from "./pages/SavingsChallenges";
import SavingsCalculator from "./pages/SavingsCalculator";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import Stocks from "./pages/Stocks";
import StockWatchlist from "./pages/StockWatchlist";
import Crypto from "./pages/Crypto";
import CryptoDetail from "./pages/CryptoDetail";
import CryptoWatchlist from "./pages/CryptoWatchlist";
import Currency from "./pages/Currency";
import CurrencyBulk from "./pages/CurrencyBulk";
import Tax from "./pages/Tax";
import TaxCompare from "./pages/TaxCompare";
import TaxBrackets from "./pages/TaxBrackets";
import Invoices from "./pages/Invoices";
import InvoiceCreate from "./pages/InvoiceCreate";
import InvoiceDetail from "./pages/InvoiceDetail";
import Debts from "./pages/Debts";
import DebtCreate from "./pages/DebtCreate";
import DebtDetail from "./pages/DebtDetail";
import DebtPayoff from "./pages/DebtPayoff";
import DebtInsights from "./pages/DebtInsights";
import NotFound from "./pages/NotFound";
import AppTour from "./components/AppTour";
import CommandPalette from "./components/CommandPalette";

const queryClient = new QueryClient();

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppTour />
          <CommandPalette />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Finance */}
            <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
            <Route path="/transactions" element={<ProtectedPage><Transactions /></ProtectedPage>} />
            <Route path="/categories" element={<ProtectedPage><Categories /></ProtectedPage>} />
            <Route path="/budgets" element={<ProtectedPage><Budgets /></ProtectedPage>} />
            <Route path="/reports" element={<ProtectedPage><Reports /></ProtectedPage>} />
            {/* Savings */}
            <Route path="/savings" element={<ProtectedPage><Savings /></ProtectedPage>} />
            <Route path="/savings/challenges" element={<ProtectedPage><SavingsChallenges /></ProtectedPage>} />
            <Route path="/savings/calculator" element={<ProtectedPage><SavingsCalculator /></ProtectedPage>} />
            {/* Gamification */}
            <Route path="/achievements" element={<ProtectedPage><Achievements /></ProtectedPage>} />
            <Route path="/leaderboard" element={<ProtectedPage><Leaderboard /></ProtectedPage>} />
            {/* Stocks */}
            <Route path="/stocks" element={<ProtectedPage><Stocks /></ProtectedPage>} />
            <Route path="/stocks/watchlist" element={<ProtectedPage><StockWatchlist /></ProtectedPage>} />
            {/* Crypto */}
            <Route path="/crypto" element={<ProtectedPage><Crypto /></ProtectedPage>} />
            <Route path="/crypto/watchlist" element={<ProtectedPage><CryptoWatchlist /></ProtectedPage>} />
            <Route path="/crypto/:coinId" element={<ProtectedPage><CryptoDetail /></ProtectedPage>} />
            {/* Currency */}
            <Route path="/currency" element={<ProtectedPage><Currency /></ProtectedPage>} />
            <Route path="/currency/bulk" element={<ProtectedPage><CurrencyBulk /></ProtectedPage>} />
            {/* Tax */}
            <Route path="/tax" element={<ProtectedPage><Tax /></ProtectedPage>} />
            <Route path="/tax/compare" element={<ProtectedPage><TaxCompare /></ProtectedPage>} />
            <Route path="/tax/brackets" element={<AppLayout><TaxBrackets /></AppLayout>} />
            {/* Invoices */}
            <Route path="/invoices" element={<ProtectedPage><Invoices /></ProtectedPage>} />
            <Route path="/invoices/new" element={<ProtectedPage><InvoiceCreate /></ProtectedPage>} />
            <Route path="/invoices/:id" element={<ProtectedPage><InvoiceDetail /></ProtectedPage>} />
            {/* Debts */}
            <Route path="/debts" element={<ProtectedPage><Debts /></ProtectedPage>} />
            <Route path="/debts/new" element={<ProtectedPage><DebtCreate /></ProtectedPage>} />
            <Route path="/debts/payoff" element={<ProtectedPage><DebtPayoff /></ProtectedPage>} />
            <Route path="/debts/insights" element={<ProtectedPage><DebtInsights /></ProtectedPage>} />
            <Route path="/debts/:id" element={<ProtectedPage><DebtDetail /></ProtectedPage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
