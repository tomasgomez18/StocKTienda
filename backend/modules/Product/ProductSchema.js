import { z } from 'zod';

export const createProductSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  detalle: z.string().optional().default(''),
  precio: z.number().positive('El precio debe ser mayor a 0'),
  cantidad: z.number().int().min(0, 'La cantidad no puede ser negativa'),
  categoria: z.string().min(1, 'La categoría es requerida'),
  proveedor: z.string().optional().default(''),
  stockMinimo: z.number().int().min(0).optional().default(2),
});

export const exchangeSchema = z.object({
  productoDevolver: z.string().min(1, 'Producto a devolver requerido'),
  cantidadDevolver: z.number().int().positive('Debe devolver al menos 1'),
  productoCargar: z.string().min(1, 'Producto a cargar requerido'),
  cantidadCargar: z.number().int().positive('Debe cargar al menos 1'),
  motivo: z.string().optional().default('Cambio'),
});

export const addStockSchema = z.object({
  cantidad: z.number().int().positive('Debe agregar al menos 1'),
});

export const sellProductSchema = z.object({
  cantidad: z.number().int().positive('Debe vender al menos 1'),
});

export const updateProductSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').optional(),
  detalle: z.string().optional(),
  precio: z.number().positive('El precio debe ser mayor a 0').optional(),
  cantidad: z.number().int().min(0, 'La cantidad no puede ser negativa').optional(),
  categoria: z.string().min(1, 'La categoría es requerida').optional(),
  proveedor: z.string().optional(),
  stockMinimo: z.number().int().min(0).optional(),
});
