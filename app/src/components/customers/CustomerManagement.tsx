'use client'

import { useState } from 'react'
import { useCustomersOnline } from '@/hooks/useCustomersOnline'
import { usePermissions } from '@/hooks/usePermissions'
import { useRewards } from '@/hooks/useRewards'
import { Customer } from '@/types/customer'
import Header from '@/components/layout/Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function CustomerManagement() {
  const { customers, loading, currentPage, hasMore, createCustomer, updateCustomer, deleteCustomer, searchCustomers, goToPage, refresh } = useCustomersOnline()
  
  // Filtrar solo clientes habilitados en el programa
  const enabledCustomers = customers.filter(c => c.programa_referidos)
  const { hasPermission } = usePermissions()
  const { enableCustomerRewards } = useRewards()
  const [showModal, setShowModal] = useState(false)
  const [showRewardsModal, setShowRewardsModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [rewardsFormData, setRewardsFormData] = useState({ referentPhone: '', referentName: '' })
  const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([])
  const [nameSuggestions, setNameSuggestions] = useState<Customer[]>([])
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false)
  const [showNameSuggestions, setShowNameSuggestions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    if (term.trim().length >= 2) {
      setIsSearching(true)
      const results = await searchCustomers(term)
      setSearchResults(results)
      setIsSearching(false)
    } else {
      setSearchResults([])
    }
  }

  const displayCustomers = searchTerm.trim().length >= 2 ? searchResults : customers

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar teléfono si se proporciona
    if (formData.phone && (formData.phone.length !== 9 || !formData.phone.startsWith('9'))) {
      setErrorMessage('El teléfono debe tener 9 dígitos y empezar con 9')
      setShowError(true)
      return
    }
    
    // Validar teléfono único
    if (formData.phone) {
      const existingCustomer = customers.find(c => 
        c.phone === formData.phone && c.id !== editingCustomer?.id
      )
      if (existingCustomer) {
        setErrorMessage('Este número de teléfono ya está registrado por otro cliente')
        setShowError(true)
        return
      }
    }
    
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData)
        setSuccessMessage('Cliente actualizado correctamente')
      } else {
        await createCustomer(formData)
        setSuccessMessage('Cliente creado correctamente')
      }
      setShowModal(false)
      setEditingCustomer(null)
      setFormData({ name: '', phone: '' })
      setShowSuccess(true)
    } catch (error) {
      setErrorMessage('Error al guardar el cliente')
      setShowError(true)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({ name: customer.name, phone: customer.phone || '' })
    setShowModal(true)
  }

  const handleDelete = async (customer: Customer) => {
    if (confirm(`¿Eliminar cliente ${customer.name}?`)) {
      try {
        await deleteCustomer(customer.id)
        setSuccessMessage('Cliente eliminado correctamente')
        setShowSuccess(true)
      } catch (error) {
        setErrorMessage('Error al eliminar el cliente')
        setShowError(true)
      }
    }
  }

  const handleEnableRewards = (customer: Customer) => {
    // Validar que el cliente tenga teléfono
    if (!customer.phone || customer.phone.trim() === '') {
      setErrorMessage('El cliente debe tener un número de teléfono para participar en el programa de premios')
      setShowError(true)
      return
    }
    
    setSelectedCustomer(customer)
    setRewardsFormData({ referentPhone: '', referentName: '' })
    setPhoneSuggestions([])
    setNameSuggestions([])
    setShowPhoneSuggestions(false)
    setShowNameSuggestions(false)
    setShowRewardsModal(true)
  }

  // Buscar referentes por teléfono
  const handleReferentPhoneChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length <= 9) {
      setRewardsFormData({...rewardsFormData, referentPhone: cleanValue})
      
      // Limpiar sugerencias de nombre
      setNameSuggestions([])
      setShowNameSuggestions(false)
      
      if (cleanValue.length >= 3) {
        const matches = enabledCustomers.filter(c => 
          c.phone && c.phone.includes(cleanValue)
        ).slice(0, 5)
        setPhoneSuggestions(matches)
        setShowPhoneSuggestions(matches.length > 0)
      } else {
        setPhoneSuggestions([])
        setShowPhoneSuggestions(false)
      }
    }
  }

  // Buscar referentes por nombre
  const handleReferentNameChange = (value: string) => {
    setRewardsFormData({...rewardsFormData, referentName: value})
    
    // Limpiar sugerencias de teléfono
    setPhoneSuggestions([])
    setShowPhoneSuggestions(false)
    
    if (value.length >= 2) {
      const matches = enabledCustomers.filter(c => 
        c.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setNameSuggestions(matches)
      setShowNameSuggestions(matches.length > 0)
    } else {
      setNameSuggestions([])
      setShowNameSuggestions(false)
    }
  }

  // Seleccionar referente de las sugerencias
  const selectReferent = (referent: Customer) => {
    setRewardsFormData({
      referentPhone: referent.phone || '',
      referentName: referent.name
    })
    setPhoneSuggestions([])
    setNameSuggestions([])
    setShowPhoneSuggestions(false)
    setShowNameSuggestions(false)
  }

  const handleRewardsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCustomer) {
      return
    }
    
    // Validar teléfono del referente si se proporciona
    if (rewardsFormData.referentPhone && (rewardsFormData.referentPhone.length !== 9 || !rewardsFormData.referentPhone.startsWith('9'))) {
      setErrorMessage('El teléfono del referente debe tener 9 dígitos y empezar con 9')
      setShowError(true)
      return
    }
    
    // Validar que el referente existe y está habilitado
    if (rewardsFormData.referentPhone || rewardsFormData.referentName) {
      const referentExists = enabledCustomers.find(c => 
        (rewardsFormData.referentPhone && c.phone === rewardsFormData.referentPhone) ||
        (rewardsFormData.referentName && c.name === rewardsFormData.referentName)
      )
      
      if (!referentExists) {
        setErrorMessage('El referente debe ser un cliente habilitado en el programa de premios. Use el autocompletado para seleccionar un referente válido.')
        setShowError(true)
        return
      }
      
      // Validar que ambos campos coincidan con el mismo cliente
      if (rewardsFormData.referentPhone && rewardsFormData.referentName) {
        const phoneMatch = enabledCustomers.find(c => c.phone === rewardsFormData.referentPhone)
        const nameMatch = enabledCustomers.find(c => c.name === rewardsFormData.referentName)
        
        if (phoneMatch?.id !== nameMatch?.id) {
          setErrorMessage('El teléfono y nombre del referente no coinciden. Use el autocompletado para seleccionar correctamente.')
          setShowError(true)
          return
        }
      }
    }
    
    const success = await enableCustomerRewards(
      selectedCustomer.id,
      rewardsFormData.referentPhone || undefined,
      rewardsFormData.referentName || undefined
    )
    
    if (success) {
      refresh()
      setShowRewardsModal(false)
      setSelectedCustomer(null)
      setRewardsFormData({ referentPhone: '', referentName: '' })
      setSuccessMessage('Cliente habilitado en el programa de premios correctamente')
      setShowSuccess(true)
    } else {
      setErrorMessage('Error al habilitar el programa de premios')
      setShowError(true)
    }
  }

  return (
    <ProtectedRoute module="customers">
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold" style={{color: '#CF432B'}}>
                    Gestión de Clientes
                  </h1>
                  {hasPermission('customers', 'create') && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-4 py-2 text-white rounded-lg transition-colors"
                      style={{backgroundColor: '#CF432B'}}
                    >
                      Nuevo Cliente
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o teléfono (mín. 2 caracteres)..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  />
                  {isSearching && (
                    <p className="text-sm text-gray-500 mt-1">Buscando...</p>
                  )}
                  {searchTerm.trim().length >= 2 && (
                    <p className="text-sm text-blue-600 mt-1">
                      Mostrando {searchResults.length} resultados de búsqueda global
                    </p>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8">Cargando clientes...</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Cliente</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programa Premios</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Habilitación</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {displayCustomers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                              <td className="px-2 py-4 text-xs text-gray-500 font-mono break-all">
                                {customer.id}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {customer.name}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                {customer.phone || '-'}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                {customer.programa_referidos ? (
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      🏆 Activo
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      C: {customer.puntos_compras || 0} | R: {customer.puntos_referidos || 0}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    No inscrito
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                {customer.programa_referidos && customer.fecha_habilitacion_premios ? (
                                  <div>
                                    <div>{customer.fecha_habilitacion_premios instanceof Date 
                                      ? customer.fecha_habilitacion_premios.toLocaleDateString('es-PE')
                                      : customer.fecha_habilitacion_premios?.toDate?.()?.toLocaleDateString('es-PE') || '-'
                                    }</div>
                                    <div className="text-xs text-gray-500">{customer.fecha_habilitacion_premios instanceof Date 
                                      ? customer.fecha_habilitacion_premios.toLocaleTimeString('es-PE')
                                      : customer.fecha_habilitacion_premios?.toDate?.()?.toLocaleTimeString('es-PE') || '-'
                                    }</div>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}</div>
                                <div className="text-xs text-gray-500">{customer.createdAt ? new Date(customer.createdAt).toLocaleTimeString() : '-'}</div>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  {hasPermission('customers', 'update') && (
                                    <button
                                      onClick={() => handleEdit(customer)}
                                      className="text-blue-600 hover:text-blue-900 mr-3"
                                    >
                                      Editar
                                    </button>
                                  )}
                                  {!customer.programa_referidos && hasPermission('customers', 'update') && (
                                    <button
                                      onClick={() => handleEnableRewards(customer)}
                                      className={`mr-3 ${
                                        customer.phone && customer.phone.trim() !== '' 
                                          ? 'text-green-600 hover:text-green-900' 
                                          : 'text-gray-400 cursor-not-allowed'
                                      }`}
                                      title={customer.phone && customer.phone.trim() !== '' ? 'Habilitar programa de premios' : 'Requiere número de teléfono'}
                                    >
                                      🏆 Premios
                                    </button>
                                  )}
                                  {hasPermission('customers', 'delete') && (
                                    <button
                                      onClick={() => handleDelete(customer)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación - Solo mostrar si no hay búsqueda activa */}
                    {searchTerm.trim().length < 2 && (
                      <div className="flex justify-between items-center mt-6">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-gray-700">
                          Página {currentPage} - {customers.length} clientes {hasMore ? '(hay más)' : '(última página)'}
                        </span>
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={!hasMore || loading}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Editar Cliente */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">
                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 9) {
                        setFormData({...formData, phone: value})
                      }
                    }}
                    className="w-full p-2 border rounded"
                    pattern="9[0-9]{8}"
                  />
                  {formData.phone && (formData.phone.length !== 9 || !formData.phone.startsWith('9')) && (
                    <p className="text-red-500 text-xs mt-1">El teléfono debe tener 9 dígitos y empezar con 9</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCustomer(null)
                      setFormData({ name: '', phone: '' })
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded text-white"
                    style={{backgroundColor: '#CF432B'}}
                  >
                    {editingCustomer ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Habilitar Premios */}
        {showRewardsModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">
                🏆 Habilitar Programa de Premios
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Cliente: <strong>{selectedCustomer.name}</strong>
              </p>
              
              <form onSubmit={handleRewardsSubmit}>
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium mb-1">Teléfono del Referente (Opcional)</label>
                  <input
                    type="tel"
                    value={rewardsFormData.referentPhone}
                    onChange={(e) => handleReferentPhoneChange(e.target.value)}
                    className="w-full p-2 border rounded"
                    pattern="9[0-9]{8}"
                    placeholder="Buscar por teléfono..."
                  />
                  {rewardsFormData.referentPhone && (rewardsFormData.referentPhone.length !== 9 || !rewardsFormData.referentPhone.startsWith('9')) && (
                    <p className="text-red-500 text-xs mt-1">El teléfono debe tener 9 dígitos y empezar con 9</p>
                  )}
                  
                  {/* Sugerencias de teléfono */}
                  {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {phoneSuggestions.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => selectReferent(customer)}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                          <div className="text-xs text-green-600">🏆 Habilitado - C: {customer.puntos_compras || 0} | R: {customer.puntos_referidos || 0}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium mb-1">Nombre del Referente (Opcional)</label>
                  <input
                    type="text"
                    value={rewardsFormData.referentName}
                    onChange={(e) => handleReferentNameChange(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Buscar por nombre..."
                  />
                  
                  {/* Sugerencias de nombre */}
                  {showNameSuggestions && nameSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {nameSuggestions.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => selectReferent(customer)}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                          <div className="text-xs text-green-600">🏆 Habilitado - C: {customer.puntos_compras || 0} | R: {customer.puntos_referidos || 0}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información del Programa</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Requisito:</strong> Cliente debe tener número de teléfono</li>
                    <li>• Compra ≥ S/15.00 = 1 punto</li>
                    <li>• 6 puntos = 1 premio</li>
                    <li>• <strong>Referente:</strong> Solo clientes habilitados (use autocompletado)</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRewardsModal(false)
                      setSelectedCustomer(null)
                      setRewardsFormData({ referentPhone: '', referentName: '' })
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded text-white"
                    style={{backgroundColor: '#CF432B'}}
                  >
                    Habilitar Programa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Error */}
        {showError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Error</h3>
              <p className="text-gray-700 mb-6">{errorMessage}</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowError(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cerrar
                </button>
                {errorMessage.includes('teléfono') && selectedCustomer && (
                  <button
                    onClick={() => {
                      setShowError(false)
                      handleEdit(selectedCustomer)
                    }}
                    className="flex-1 px-4 py-2 rounded-lg text-white"
                    style={{backgroundColor: '#CF432B'}}
                  >
                    Agregar Teléfono
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Éxito */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-green-600">✅ Éxito</h3>
              <p className="text-gray-700 mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full px-4 py-2 rounded-lg text-white"
                style={{backgroundColor: '#CF432B'}}
              >
                Aceptar
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}