import PurchaseManagement from '@/components/purchases/PurchaseManagement'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function PurchasesPage() {
  return (
    <ProtectedRoute module="purchases">
      <PurchaseManagement />
    </ProtectedRoute>
  )
}