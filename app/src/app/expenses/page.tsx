import ExpenseManagement from '@/components/expenses/ExpenseManagement'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function ExpensesPage() {
  return (
    <ProtectedRoute module="expenses">
      <ExpenseManagement />
    </ProtectedRoute>
  )
}