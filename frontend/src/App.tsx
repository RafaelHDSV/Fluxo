import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { AccountsPage } from '@/pages/AccountsPage'
import { BudgetsPage } from '@/pages/BudgetsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { InvestmentsPage } from '@/pages/InvestmentsPage'
import { ImportsPage } from '@/pages/ImportsPage'
import { LoginPage } from '@/pages/LoginPage'
import { PayablesPage } from '@/pages/PayablesPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { WishlistPage } from '@/pages/WishlistPage'

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="a-pagar" element={<PayablesPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="imports" element={<ImportsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="investments" element={<InvestmentsPage />} />
          <Route path="goals" element={<Navigate to="/investments" replace />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
