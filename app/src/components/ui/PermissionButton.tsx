'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { Module, Permission } from '@/types/permissions'

interface PermissionButtonProps {
  module: Module
  permission: Permission
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export default function PermissionButton({ 
  module, 
  permission, 
  children, 
  className = '', 
  onClick,
  disabled = false
}: PermissionButtonProps) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(module, permission)) {
    return null
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  )
}