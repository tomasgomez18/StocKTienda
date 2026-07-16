import { z } from 'zod';

export const createSaleSchema = z.object({
  producto: z.string().min(1, 'Producto requerido'),
  cantidad: z.number().int().positive('Debe vender al menos 1'),
  empleado: z.string().min(1, 'El nombre del empleado es requerido'),
  metodoPago: z.enum(['efectivo', 'transferencia', 'tarjeta']),
  talle: z.string().optional().default(''),
});
