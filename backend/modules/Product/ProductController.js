import mongoose from 'mongoose';
import Product from './ProductModel.js';
import Return from '../Return/ReturnModel.js';
import Sale from '../Sale/SaleModel.js';
import { createProductSchema, updateProductSchema, sellProductSchema, exchangeSchema, addStockSchema } from './ProductSchema.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getProducts = async (req, res, next) => {
  try {
    const { search, categoria } = req.query;
    const filter = {};

    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { nombre: { $regex: safe, $options: 'i' } },
        { categoria: { $regex: safe, $options: 'i' } },
      ];
    }
    if (categoria) {
      filter.categoria = { $regex: escapeRegex(categoria), $options: 'i' };
    }

    const products = await Product.find(filter).sort({ nombre: 1 });

    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const sellProduct = async (req, res, next) => {
  try {
    const { cantidad } = sellProductSchema.parse(req.body);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (product.cantidad < cantidad) {
      return res.status(400).json({
        message: `Stock insuficiente. Solo hay ${product.cantidad} unidad(es) disponible(s).`,
      });
    }

    product.cantidad -= cantidad;
    await product.save();

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const addStock = async (req, res, next) => {
  try {
    const { cantidad } = addStockSchema.parse(req.body);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    product.cantidad += cantidad;
    await product.save();

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const exchangeProduct = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const data = exchangeSchema.parse(req.body);

    const productoDevuelto = await Product.findById(data.productoDevolver).session(session);
    if (!productoDevuelto) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Producto a devolver no encontrado' });
    }

    const productoCargado = await Product.findById(data.productoCargar).session(session);
    if (!productoCargado) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Producto a cargar no encontrado' });
    }

    if (productoCargado.cantidad < data.cantidadCargar) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Stock insuficiente de "${productoCargado.nombre}". Solo hay ${productoCargado.cantidad} unidad(es).`,
      });
    }

    productoDevuelto.cantidad += data.cantidadDevolver;
    productoCargado.cantidad -= data.cantidadCargar;

    await productoDevuelto.save({ session });
    await productoCargado.save({ session });

    await Return.create([{
      producto: data.productoDevolver,
      cantidad: data.cantidadDevolver,
      motivo: data.motivo || `Cambio por ${productoCargado.nombre}`,
    }], { session });

    let pendiente = data.cantidadDevolver;
    const sales = await Sale.find({ producto: data.productoDevolver }).sort({ createdAt: -1 }).session(session);

    for (const sale of sales) {
      if (pendiente <= 0) break;

      if (sale.cantidad <= pendiente) {
        pendiente -= sale.cantidad;
        await Sale.findByIdAndDelete(sale._id).session(session);
      } else {
        sale.cantidad -= pendiente;
        sale.total = sale.precio * sale.cantidad;
        await sale.save({ session });
        pendiente = 0;
      }
    }

    await session.commitTransaction();

    res.json({
      message: 'Cambio registrado correctamente',
      productoDevuelto,
      productoCargado,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalProductos = await Product.countDocuments();
    const totalCategorias = await Product.distinct('categoria').then((cats) => cats.length);
    const totalProveedores = await Product.distinct('proveedor').then(
      (provs) => provs.filter(Boolean).length
    );
    const totalDevoluciones = await Return.countDocuments();

    res.json({
      totalProductos,
      totalCategorias,
      totalProveedores,
      totalDevoluciones,
    });
  } catch (error) {
    next(error);
  }
};
