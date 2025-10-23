'use client'

// Offline Storage Manager
export class OfflineStorage {
  private static instance: OfflineStorage
  
  static getInstance() {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage()
    }
    return OfflineStorage.instance
  }

  // Productos cache
  saveProducts(products: any[]) {
    localStorage.setItem('offline_products', JSON.stringify(products))
    localStorage.setItem('offline_products_timestamp', Date.now().toString())
  }

  getProducts() {
    const products = localStorage.getItem('offline_products')
    return products ? JSON.parse(products) : []
  }

  clearProducts() {
    localStorage.removeItem('offline_products')
    localStorage.removeItem('offline_products_timestamp')
  }

  // Inventario cache
  saveInventory(inventory: any[]) {
    localStorage.setItem('offline_inventory', JSON.stringify(inventory))
  }

  getInventory() {
    const inventory = localStorage.getItem('offline_inventory')
    return inventory ? JSON.parse(inventory) : []
  }

  // Pedidos offline
  saveOfflineOrder(order: any) {
    const orders = this.getOfflineOrders()
    orders.push({ ...order, id: Date.now().toString(), offline: true })
    localStorage.setItem('offline_orders', JSON.stringify(orders))
  }

  getOfflineOrders() {
    const orders = localStorage.getItem('offline_orders')
    return orders ? JSON.parse(orders) : []
  }

  clearOfflineOrders() {
    localStorage.removeItem('offline_orders')
  }

  // Usuario offline
  saveOfflineUser(userData: { name: string, photo: string }) {
    localStorage.setItem('offline_user', JSON.stringify(userData))
  }

  getOfflineUser() {
    const user = localStorage.getItem('offline_user')
    return user ? JSON.parse(user) : null
  }

  clearOfflineUser() {
    localStorage.removeItem('offline_user')
  }
}

export const offlineStorage = OfflineStorage.getInstance()