import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    detalle: {
      type: String,
      trim: true,
      default: '',
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    categoria: {
      type: String,
      required: true,
      trim: true,
    },
    proveedor: {
      type: String,
      trim: true,
      default: '',
    },
    stockMinimo: {
      type: Number,
      default: 2,
      min: 0,
    },
  },
  { timestamps: true }
);

productSchema.index({ nombre: 'text' });
productSchema.index({ categoria: 1 });

export default mongoose.model('Product', productSchema);
