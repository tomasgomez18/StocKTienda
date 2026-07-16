import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  exchangeProduct,
  addStock,
} from '../../api/products';
import { createReturn } from '../../api/returns';
import { createSale } from '../../api/sales';
import ProductForm from '../../components/ProductForm/ProductForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sellModal, setSellModal] = useState(null);
  const [sellCantidad, setSellCantidad] = useState(1);
  const [sellEmpleado, setSellEmpleado] = useState('');
  const [dropdown, setDropdown] = useState({ product: null, x: 0, y: 0 });

  const [error, setError] = useState('');
  const [returnModal, setReturnModal] = useState(null);
  const [returnCantidad, setReturnCantidad] = useState(1);
  const [returnMotivo, setReturnMotivo] = useState('');
  const [returnOtroMotivo, setReturnOtroMotivo] = useState('');
  const [exchangeActivo, setExchangeActivo] = useState(false);
  const [exchangeSearch, setExchangeSearch] = useState('');
  const [exchangeTarget, setExchangeTarget] = useState(null);
  const [exchangeCantidad, setExchangeCantidad] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const prodRes = await getProducts({ search });
      setProducts(prodRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleSubmit = async (data) => {
    try {
      if (editing) {
        await updateProduct(editing._id, data);
      } else {
        await createProduct(data);
      }
      setShowForm(false);
      setEditing(null);
      fetchData();
      Swal.fire({ icon: 'success', title: 'Producto guardado', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al guardar producto', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const handleEdit = (product) => {
    setEditing(product);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await Swal.fire({ icon: 'question', title: '¿Eliminar este producto?', text: 'Esta acción no se puede deshacer', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', background: '#171717', color: '#fff', confirmButtonColor: '#ef4444' });
    if (!confirmed.isConfirmed) return;
    try {
      await deleteProduct(id);
      fetchData();
      Swal.fire({ icon: 'success', title: 'Producto eliminado', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al eliminar producto', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const [sellMetodoPago, setSellMetodoPago] = useState('efectivo');

  const openSell = (product) => {
    setSellModal(product);
    setSellCantidad(1);
    setSellEmpleado('');
    setSellMetodoPago('efectivo');
  };

  const confirmSell = async () => {
    if (!sellEmpleado.trim()) {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debe ingresar el nombre del empleado', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    try {
      await createSale({
        producto: sellModal._id,
        cantidad: sellCantidad,
        empleado: sellEmpleado.trim(),
        metodoPago: sellMetodoPago,
      });
      setSellModal(null);
      fetchData();
      Swal.fire({ icon: 'success', title: 'Venta registrada', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al vender', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const [addStockModal, setAddStockModal] = useState(null);
  const [addStockCantidad, setAddStockCantidad] = useState(1);

  const openAddStock = (product) => {
    setAddStockModal(product);
    setAddStockCantidad(1);
  };

  const confirmAddStock = async () => {
    try {
      await addStock(addStockModal._id, { cantidad: addStockCantidad });
      setAddStockModal(null);
      fetchData();
      Swal.fire({ icon: 'success', title: 'Stock actualizado', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al agregar stock', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const openReturn = (product) => {
    setReturnModal(product);
    setReturnCantidad(1);
    setReturnMotivo('');
    setReturnOtroMotivo('');
    setExchangeActivo(false);
    setExchangeSearch('');
    setExchangeTarget(null);
    setExchangeCantidad(1);
  };

  const getReturnMotivo = () => returnMotivo === 'Otro' ? returnOtroMotivo.trim() : returnMotivo.trim();

  const confirmReturn = async () => {
    const motivoFinal = getReturnMotivo();
    if (!motivoFinal) {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debe ingresar un motivo', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    try {
      if (exchangeTarget) {
        await exchangeProduct({
          productoDevolver: returnModal._id,
          cantidadDevolver: returnCantidad,
          productoCargar: exchangeTarget._id,
          cantidadCargar: exchangeCantidad,
          motivo: motivoFinal,
        });
      } else {
        await createReturn({
          producto: returnModal._id,
          cantidad: returnCantidad,
          motivo: motivoFinal,
        });
      }
      setReturnModal(null);
      fetchData();
      Swal.fire({ icon: 'success', title: exchangeTarget ? 'Cambio registrado' : 'Devolución registrada', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al registrar', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const filteredExchange = products.filter(
    (p) =>
      p._id !== returnModal?._id &&
      p.nombre.toLowerCase().includes(exchangeSearch.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Productos</h1>
        <button
          onClick={openCreate}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-lg transition-all text-sm"
        >
          + Nuevo Producto
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.10] transition-all text-sm"
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <ProductForm
              initial={editing}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}

      {sellModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-sm mx-4">
            <h2 className="text-xl font-bold text-white mb-2">Vender Producto</h2>
            <p className="text-white/50 text-sm mb-4">
              {sellModal.nombre} — Stock actual: <span className="text-white font-semibold">{sellModal.cantidad}</span>
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
                  Empleado
                </label>
                <input
                  type="text"
                  required
                  value={sellEmpleado}
                  onChange={(e) => setSellEmpleado(e.target.value)}
                  placeholder="Nombre del empleado"
                  className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
                  Cantidad
                </label>
                <input
                  type="number"
                  min={1}
                  max={sellModal.cantidad}
                  value={sellCantidad}
                  onChange={(e) => setSellCantidad(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Metodo de pago</label>
                <div className="flex gap-2">
                  {['efectivo', 'transferencia', 'tarjeta'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSellMetodoPago(m)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                        sellMetodoPago === m
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-white/[0.07] text-white/50 border-white/10 hover:bg-white/[0.10]'
                      }`}
                    >
                      {m === 'efectivo' ? 'Efectivo' : m === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSellModal(null)}
                className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSell}
                className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 transition-all"
              >
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {addStockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-sm mx-4">
            <h2 className="text-xl font-bold text-white mb-2">Agregar Stock</h2>
            <p className="text-white/50 text-sm mb-4">
              <span className="text-white font-semibold">{addStockModal.nombre}</span> — Stock actual: {addStockModal.cantidad}
            </p>
            <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
              ¿Cuántas unidades entraron?
            </label>
            <input
              type="number"
              min={1}
              value={addStockCantidad}
              onChange={(e) => setAddStockCantidad(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm mb-6"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAddStockModal(null)}
                className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAddStock}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm hover:bg-cyan-500/30 transition-all"
              >
                Confirmar Ingreso
              </button>
            </div>
          </div>
        </div>
      )}

      {returnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              Devolución / Cambio
            </h2>
            <p className="text-white/50 text-sm mb-4">
              <span className="text-white font-semibold">{returnModal.nombre}</span> — Stock actual: {returnModal.cantidad}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
                  Cantidad a devolver
                </label>
                <input
                  type="number"
                  min={1}
                  value={returnCantidad}
                  onChange={(e) => setReturnCantidad(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exchangeActivo}
                  onChange={(e) => {
                    setExchangeActivo(e.target.checked);
                    setExchangeTarget(null);
                    setExchangeSearch('');
                  }}
                  className="w-4 h-4 rounded bg-white/[0.07] border-white/10 text-purple-400 focus:ring-purple-500/30"
                />
                <span className="text-sm text-white/70">Quiero cambiarlo por otro producto</span>
              </label>

              {exchangeActivo && (
                <>
                  <div>
                    <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
                      Buscar producto nuevo
                    </label>
                    <input
                      type="text"
                      value={exchangeSearch}
                      onChange={(e) => setExchangeSearch(e.target.value)}
                      placeholder="Escribí el nombre..."
                      className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                    />
                  </div>

                  {exchangeSearch && filteredExchange.length > 0 && (
                    <div className="border border-white/10 rounded-lg max-h-36 overflow-y-auto bg-neutral-800/50">
                      {filteredExchange.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => {
                            setExchangeTarget(p);
                            setExchangeSearch('');
                            setExchangeCantidad(1);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm border-b border-white/5 last:border-0 transition-colors ${
                            exchangeTarget?._id === p._id ? 'bg-purple-500/10 text-purple-300 font-semibold' : 'text-white/60 hover:bg-white/5'
                          }`}
                        >
                          {p.nombre} <span className="text-white/30">(stock: {p.cantidad})</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {exchangeTarget && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                      <p className="text-sm text-purple-300 mb-2">
                        <span className="font-semibold">Producto nuevo:</span> {exchangeTarget.nombre}
                        <br />
                        <span className="font-semibold">Stock disponible:</span> {exchangeTarget.cantidad}
                      </p>
                      <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
                        Cantidad a cargar
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={exchangeTarget.cantidad}
                        value={exchangeCantidad}
                        onChange={(e) => setExchangeCantidad(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-white/[0.07] border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500/40 transition-all text-sm"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
                  Motivo
                </label>
                <select
                  value={returnMotivo}
                  onChange={(e) => setReturnMotivo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
                >
                  <option value="" className="bg-neutral-900">Seleccionar motivo</option>
                  <option value="Defectuoso" className="bg-neutral-900">Defectuoso</option>
                  <option value="Cambio de talla" className="bg-neutral-900">Cambio de talla</option>
                  <option value="Cambio de modelo" className="bg-neutral-900">Cambio de modelo</option>
                  <option value="Devolución de venta" className="bg-neutral-900">Devolución de venta</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setReturnModal(null)}
                className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReturn}
                className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-sm hover:bg-orange-500/30 transition-all"
              >
                {exchangeTarget ? 'Confirmar Cambio' : 'Confirmar Devolución'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Nombre</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Detalle</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Precio</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Cantidad</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Categoría</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Proveedor</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-white/30">
                    {error || 'No hay productos'}
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{p.nombre}</td>
                    <td className="px-4 py-3 text-white/50 max-w-xs truncate">{p.detalle || '—'}</td>
                    <td className="px-4 py-3 text-white/70">
                      {p.precio != null ? `$${Number(p.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 ${(p.stockMinimo != null && p.cantidad <= p.stockMinimo) ? 'text-red-400 font-semibold' : 'text-white/60'}`}>
                        {(p.stockMinimo != null && p.cantidad <= p.stockMinimo) && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {p.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">{p.categoria}</td>
                    <td className="px-4 py-3 text-white/50">{p.proveedor || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdown(
                            dropdown.product?._id === p._id
                              ? { product: null, x: 0, y: 0 }
                              : { product: p, x: rect.right - 160, y: rect.bottom + 4 }
                          );
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/40 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {dropdown.product && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setDropdown({ product: null, x: 0, y: 0 })} />
          <div
            className="fixed z-40 w-40 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-1.5"
            style={{ left: dropdown.x, top: dropdown.y }}
          >
            <button
              onClick={() => { openSell(dropdown.product); setDropdown({ product: null, x: 0, y: 0 }); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-400 hover:bg-white/5 transition-colors"
            >
              Vender
            </button>
            <button
              onClick={() => { openAddStock(dropdown.product); setDropdown({ product: null, x: 0, y: 0 }); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-cyan-400 hover:bg-white/5 transition-colors"
            >
               Agregar Stock
            </button>
            <button
              onClick={() => { openReturn(dropdown.product); setDropdown({ product: null, x: 0, y: 0 }); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-orange-400 hover:bg-white/5 transition-colors"
            >
              Cambio
            </button>
            <button
              onClick={() => { handleEdit(dropdown.product); setDropdown({ product: null, x: 0, y: 0 }); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-400 hover:bg-white/5 transition-colors"
            >
               Editar
            </button>
            <button
              onClick={() => { handleDelete(dropdown.product._id); setDropdown({ product: null, x: 0, y: 0 }); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
            >
               Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Products;
