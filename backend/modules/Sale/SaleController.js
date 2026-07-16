import mongoose from 'mongoose';
import Sale from './SaleModel.js';
import Product from '../Product/ProductModel.js';
import Return from '../Return/ReturnModel.js';
import DailyClose from './DailyCloseModel.js';
import { createSaleSchema } from './SaleSchema.js';

const parseDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
};

export const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const data = createSaleSchema.parse(req.body);

    const product = await Product.findById(data.producto).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (product.cantidad < data.cantidad) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Stock insuficiente. Solo hay ${product.cantidad} unidad(es).`,
      });
    }

    const total = product.precio * data.cantidad;

    product.cantidad -= data.cantidad;
    await product.save({ session });

    const sale = await Sale.create([{
      producto: data.producto,
      cantidad: data.cantidad,
      precio: product.precio,
      total,
      empleado: data.empleado,
      metodoPago: data.metodoPago,
    }], { session });

    await session.commitTransaction();

    const populated = await sale[0].populate('producto', 'nombre');

    res.status(201).json(populated);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const deleteSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const sale = await Sale.findById(req.params.id).session(session);
    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    const returnsCount = await Return.countDocuments({ producto: sale.producto }).session(session);
    if (returnsCount > 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'No se puede eliminar la venta porque tiene devoluciones asociadas' });
    }

    const product = await Product.findById(sale.producto).session(session);
    if (product) {
      product.cantidad += sale.cantidad;
      await product.save({ session });
    }

    await Sale.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();
    res.json({ message: 'Venta eliminada correctamente' });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const getSales = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filter = {};

    if (desde || hasta) {
      const start = parseDate(desde) || new Date(0);
      const end = parseDate(hasta);
      filter.createdAt = { $gte: start, $lt: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : new Date(8640000000000000) };
    }

    const sales = await Sale.find(filter)
      .populate('producto', 'nombre categoria')
      .sort({ createdAt: -1 });

    const total = sales.reduce((sum, s) => sum + s.total, 0);

    res.json({ sales, total });
  } catch (error) {
    next(error);
  }
};

export const getMostSold = async (req, res, next) => {
  try {
    const { desde, hasta, limit = 5 } = req.query;
    const match = {};

    if (desde || hasta) {
      const start = parseDate(desde) || new Date(0);
      const end = parseDate(hasta);
      match.createdAt = { $gte: start, $lt: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : new Date(8640000000000000) };
    }

    const mostSold = await Sale.aggregate([
      { $match: match },
      { $group: { _id: '$producto', totalVendido: { $sum: '$cantidad' }, ingresos: { $sum: '$total' } } },
      { $sort: { totalVendido: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'producto',
        },
      },
      { $unwind: '$producto' },
      {
        $project: {
          _id: 0,
          productoId: '$_id',
          nombre: '$producto.nombre',
          categoria: '$producto.categoria',
          totalVendido: 1,
          ingresos: 1,
        },
      },
    ]);

    res.json(mostSold);
  } catch (error) {
    next(error);
  }
};

const todayDateRange = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return { $gte: start, $lt: end };
};

export const getDailyClose = async (req, res, next) => {
  try {
    const sales = await Sale.find({ createdAt: todayDateRange() });

    const total = sales.reduce((sum, s) => sum + s.total, 0);
    const cantidad = sales.reduce((sum, s) => sum + s.cantidad, 0);

    const porMetodo = sales.reduce((acc, s) => {
      const m = s.metodoPago || 'efectivo';
      if (!acc[m]) acc[m] = { total: 0, cantidad: 0 };
      acc[m].total += s.total;
      acc[m].cantidad += s.cantidad;
      return acc;
    }, {});

    const today = new Date();
    const fechaDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const close = await DailyClose.findOneAndUpdate(
      { fecha: fechaDate },
      {
        fecha: fechaDate,
        total,
        cantidad,
        efectivo: porMetodo.efectivo || { total: 0, cantidad: 0 },
        transferencia: porMetodo.transferencia || { total: 0, cantidad: 0 },
        tarjeta: porMetodo.tarjeta || { total: 0, cantidad: 0 },
        cerradoAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      fecha: new Date().toLocaleDateString('es-AR'),
      total: close.total,
      cantidad: close.cantidad,
      efectivo: close.efectivo,
      transferencia: close.transferencia,
      tarjeta: close.tarjeta,
      cerradoAt: close.cerradoAt,
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyCloses = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filter = {};

    if (desde || hasta) {
      const start = parseDate(desde) || new Date(0);
      const end = parseDate(hasta);
      filter.fecha = {
        $gte: start,
        $lt: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : new Date(8640000000000000),
      };
    }

    const closes = await DailyClose.find(filter).sort({ fecha: -1 });
    res.json(closes);
  } catch (error) {
    next(error);
  }
};

export const getSalesStats = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filter = {};

    if (desde || hasta) {
      const start = parseDate(desde) || new Date(0);
      const end = parseDate(hasta);
      filter.createdAt = { $gte: start, $lt: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : new Date(8640000000000000) };
    }

    const sales = await Sale.find(filter);
    const total = sales.reduce((sum, s) => sum + s.total, 0);
    const cantidad = sales.reduce((sum, s) => sum + s.cantidad, 0);

    const porMetodo = sales.reduce((acc, s) => {
      const m = s.metodoPago || 'efectivo';
      if (!acc[m]) acc[m] = { total: 0, cantidad: 0 };
      acc[m].total += s.total;
      acc[m].cantidad += s.cantidad;
      return acc;
    }, {});

    res.json({
      total,
      cantidad,
      efectivo: porMetodo.efectivo || { total: 0, cantidad: 0 },
      transferencia: porMetodo.transferencia || { total: 0, cantidad: 0 },
      tarjeta: porMetodo.tarjeta || { total: 0, cantidad: 0 },
    });
  } catch (error) {
    next(error);
  }
};
