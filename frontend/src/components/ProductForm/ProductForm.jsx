import { useState } from 'react';

const ProductForm = ({ initial, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    nombre: initial?.nombre || '',
    detalle: initial?.detalle || '',
    precio: initial?.precio || '',
    cantidad: initial?.cantidad ?? '',
    categoria: initial?.categoria || '',
    proveedor: initial?.proveedor || '',
    stockMinimo: initial?.stockMinimo ?? 2,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      precio: Number(form.precio),
      cantidad: Number(form.cantidad),
      stockMinimo: Number(form.stockMinimo),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Nombre</label>
          <input
            type="text"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Detalle</label>
          <textarea
            value={form.detalle}
            onChange={(e) => setForm({ ...form, detalle: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Precio</label>
          <input
            type="number"
            step="0.01"
            required
            min="0"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Cantidad</label>
          <input
            type="number"
            required
            min="0"
            value={form.cantidad}
            onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Stock Minimo</label>
          <input
            type="number"
            required
            min="0"
            value={form.stockMinimo}
            onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Categoría</label>
          <input
            type="text"
            required
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
            placeholder="Ej: Pantalones, Remeras, Buzos..."
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Proveedor</label>
          <input
            type="text"
            value={form.proveedor}
            onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
            placeholder="Nombre del proveedor"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg text-sm transition-all"
        >
          {initial ? 'Actualizar' : 'Crear'} Producto
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
