'use client'

import { createContext, useContext } from 'react'

interface PermissionsContextType {
  refreshPermissions: () => void
}

const PermissionsContext = createContext<PermissionsContextType | null>(null)

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext)
  return context
}

export const PermissionsProvider = ({ children, refreshPermissions }: { 
  children: React.ReactNode
  refreshPermissions: () => void 
}) => {
  return (
    <PermissionsContext.Provider value={{ refreshPermissions }}>
      {children}
    </PermissionsContext.Provider>
  )
}