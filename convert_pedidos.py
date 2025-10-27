#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import csv
import sys
from datetime import datetime
from collections import defaultdict

def convert_date(date_str):
    """Convierte fecha del formato d/m/yy al formato YYYY-MM-DD"""
    try:
        # Parsear fecha en formato d/m/yy
        day, month, year = date_str.split('/')
        
        # Convertir año de 2 dígitos a 4 dígitos
        if int(year) >= 25:  # Asumiendo que 25+ es 2025+
            year = '20' + year
        else:
            year = '20' + year
            
        # Formatear con ceros a la izquierda
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except:
        return "2025-01-01"  # Fecha por defecto

def normalize_payment_method(method):
    """Normaliza el método de pago"""
    method = method.upper().strip()
    if method in ['EFECTIVO', 'CASH']:
        return 'Efectivo'
    elif method in ['YAPE']:
        return 'Yape'
    elif method in ['PLIN']:
        return 'Plin'
    elif method in ['TARJETA', 'CARD']:
        return 'Tarjeta'
    elif method in ['TRANSFERENCIA']:
        return 'Transferencia'
    else:
        return 'Efectivo'  # Por defecto

def main():
    input_file = '/Users/antonio/Programacion/WorkSpace/php/sending/app/public/_pedidos local.csv'
    output_file = '/Users/antonio/Programacion/WorkSpace/php/sending/app/public/pedidos_import_completo.csv'
    
    # Agrupar pedidos por fecha, método de pago y cliente
    orders = defaultdict(lambda: {
        'items': [],
        'subtotal': 0,
        'total': 0,
        'date': '',
        'payment_method': '',
        'customer': ''
    })
    
    try:
        with open(input_file, 'r', encoding='utf-8-sig') as file:
            # Leer líneas y procesar manualmente debido al formato especial
            lines = file.readlines()
            
            for line_num, line in enumerate(lines[1:], 2):  # Saltar header
                line = line.strip()
                if not line:
                    continue
                    
                # Dividir por punto y coma
                parts = line.split(';')
                if len(parts) < 5:
                    print(f"Línea {line_num}: Formato incorrecto - {line}")
                    continue
                
                fecha = parts[0].strip()
                producto = parts[1].strip()
                precio = float(parts[2].strip())
                cantidad = int(parts[3].strip())
                medio_pago = parts[4].strip()
                cliente = parts[5].strip() if len(parts) > 5 else ''
                
                # Crear clave única para agrupar pedidos
                date_formatted = convert_date(fecha)
                payment_normalized = normalize_payment_method(medio_pago)
                
                # Agrupar por fecha y método de pago (y cliente si existe)
                order_key = f"{date_formatted}_{payment_normalized}_{cliente}_{line_num // 10}"
                
                # Agregar item al pedido
                subtotal_item = precio * cantidad
                orders[order_key]['items'].append(f"{producto}:{precio}:{cantidad}")
                orders[order_key]['subtotal'] += subtotal_item
                orders[order_key]['total'] += subtotal_item
                orders[order_key]['date'] = date_formatted
                orders[order_key]['payment_method'] = payment_normalized
                orders[order_key]['customer'] = cliente
                
    except Exception as e:
        print(f"Error leyendo archivo: {e}")
        return
    
    # Escribir archivo de salida
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            
            # Header del CSV de importación
            writer.writerow([
                'items', 'subtotal', 'discount', 'total', 'orderType', 
                'paymentStatus', 'orderStatus', 'paymentMethod', 'customerName', 
                'customerPhone', 'tableNumber', 'deliveryAddress', 'fecha', 'hora'
            ])
            
            # Escribir cada pedido agrupado
            for order_key, order_data in orders.items():
                items_str = ';'.join(order_data['items'])
                
                writer.writerow([
                    f'"{items_str}"',  # items
                    f"{order_data['subtotal']:.2f}",  # subtotal
                    "0",  # discount
                    f"{order_data['total']:.2f}",  # total
                    "Mesa",  # orderType
                    "Pagado",  # paymentStatus
                    "Cerrada",  # orderStatus
                    order_data['payment_method'],  # paymentMethod
                    order_data['customer'] if order_data['customer'] else '',  # customerName
                    '',  # customerPhone
                    '',  # tableNumber
                    '',  # deliveryAddress
                    order_data['date'],  # fecha
                    '12:00:00'  # hora por defecto
                ])
        
        print(f"✅ Conversión completada!")
        print(f"📄 Archivo de entrada: {input_file}")
        print(f"📄 Archivo de salida: {output_file}")
        print(f"📊 Total de pedidos agrupados: {len(orders)}")
        
    except Exception as e:
        print(f"❌ Error escribiendo archivo: {e}")

if __name__ == "__main__":
    main()