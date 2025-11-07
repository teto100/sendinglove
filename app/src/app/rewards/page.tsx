'use client'

import { useState } from 'react'
import { Tab } from '@headlessui/react'
import { 
  GiftIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  CogIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Header from '@/components/layout/Header'
import CustomerSearch from '@/components/rewards/CustomerSearch'
import PrizesManagement from '@/components/rewards/PrizesManagement'
import RewardsHistory from '@/components/rewards/RewardsHistory'
import RewardsStats from '@/components/rewards/RewardsStats'
import RewardsConfig from '@/components/rewards/RewardsConfig'

const tabs = [
  { name: 'Buscar Cliente', icon: MagnifyingGlassIcon, component: CustomerSearch },
  { name: 'Gestión Premios', icon: GiftIcon, component: PrizesManagement },
  { name: 'Historial', icon: UserGroupIcon, component: RewardsHistory },
  { name: 'Estadísticas', icon: ChartBarIcon, component: RewardsStats },
  { name: 'Configuración', icon: CogIcon, component: RewardsConfig }
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function RewardsPage() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <ProtectedRoute module="rewards">
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              🏆 Sistema de Premios
            </h1>
            <p className="mt-2 text-gray-600">
              Gestión completa del programa de recompensas para clientes frecuentes
            </p>
          </div>

          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-700'
                    )
                  }
                >
                  <div className="flex items-center justify-center space-x-2">
                    <tab.icon className="h-5 w-5" />
                    <span className="hidden sm:inline">{tab.name}</span>
                  </div>
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels>
              {tabs.map((tab, index) => (
                <Tab.Panel
                  key={index}
                  className="rounded-xl bg-white p-6 shadow-lg ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
                >
                  <tab.component />
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </ProtectedRoute>
  )
}