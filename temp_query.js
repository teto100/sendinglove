// Simulación de datos basada en los logs que hemos visto
const purchasesData = [
  { productName: 'papa', quantity: 3.5, totalAmount: 10.6 },
  { productName: 'papa ', quantity: 2.4, totalAmount: 8.4 },
  { productName: 'papa ', quantity: 1.86, totalAmount: 6.5037 },
  { productName: 'papa', quantity: 2.54, totalAmount: 8.9 },
  { productName: 'Papaya', quantity: 2.4, totalAmount: 8.4 },
  // Agregar más datos simulados basados en categorías disponibles
  { productName: 'Carne molida', quantity: 2, totalAmount: 15.0 },
  { productName: 'Leche', quantity: 6, totalAmount: 18.0 },
  { productName: 'Tomate', quantity: 3, totalAmount: 9.0 },
  { productName: 'Cebolla', quantity: 2, totalAmount: 6.0 },
  { productName: 'Arroz', quantity: 5, totalAmount: 12.5 },
  { productName: 'Sal', quantity: 1, totalAmount: 2.5 },
  { productName: 'Gaseosa', quantity: 12, totalAmount: 24.0 },
  { productName: 'Pan', quantity: 20, totalAmount: 10.0 }
];

function getGroupedProducts() {
  const productGroups = {};
  
  purchasesData.forEach(purchase => {
    const productName = (purchase.productName || 'Sin nombre').toLowerCase().replace(/\s+/g, ' ').trim();
    
    if (!productGroups[productName]) {
      productGroups[productName] = {
        originalName: purchase.productName || 'Sin nombre',
        count: 0,
        totalQuantity: 0,
        totalCost: 0
      };
    }
    
    productGroups[productName].count += 1;
    productGroups[productName].totalQuantity += purchase.quantity || 0;
    productGroups[productName].totalCost += purchase.totalAmount || 0;
  });
  
  const sorted = Object.values(productGroups).sort((a, b) => b.count - a.count);
  
  console.log('=== PRODUCTOS COMPRADOS PARA ALMACÉN ===\n');
  sorted.forEach((product, i) => {
    console.log(`${i + 1}. ${product.originalName}`);
    console.log(`   Compras: ${product.count}`);
    console.log(`   Cantidad total: ${product.totalQuantity}`);
    console.log(`   Costo total: S/ ${product.totalCost.toFixed(2)}\n`);
  });
  
  console.log(`Total productos únicos: ${sorted.length}`);
}

getGroupedProducts();