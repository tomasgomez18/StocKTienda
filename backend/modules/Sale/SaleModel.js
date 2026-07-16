import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    empleado: {
      type: String,
      required: true,
      trim: true,
    },
    metodoPago: {
      type: String,
      enum: ['efectivo', 'transferencia', 'tarjeta'],
      required: true,
    },
    talle: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

saleSchema.index({ producto: 1, createdAt: -1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ metodoPago: 1 });

export default mongoose.model('Sale', saleSchema);
