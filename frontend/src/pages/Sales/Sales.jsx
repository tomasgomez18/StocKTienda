import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getSales, getSalesStats, getMostSold, salesLogin, deleteSale, getDailyClose } from '../../api/sales';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const mondayOfWeek = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const sundayOfWeek = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 0 : 7 - d.getDay();
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const firstOfMonth = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
};

const periodos = [
  { key: 'todas', label: 'Todas', desde: () => '', hasta: () => '' },
  { key: 'dia', label: 'Hoy', desde: today, hasta: today },
  { key: 'semana', label: 'Semana', desde: mondayOfWeek, hasta: sundayOfWeek },
  { key: 'mes', label: 'Mes', desde: firstOfMonth, hasta: today },
];

const Sales = () => {
  const [authed, setAuthed] = useState(!!localStorage.getItem('salesToken'));
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [desde, setDesde] = useState(today);
  const [hasta, setHasta] = useState(today);
  const [activePeriodo, setActivePeriodo] = useState('dia');
  const [data, setData] = useState({ sales: [], total: 0 });
  const [stats, setStats] = useState(null);
  const [mostSold, setMostSold] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const handleSalesLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await salesLogin({ email: loginEmail, password: loginPassword });
      localStorage.setItem('salesToken', res.data.token);
      setAuthed(true);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Error al iniciar sesion');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('salesToken');
    setAuthed(false);
  };

  const fetchData = () => {
    if (!localStorage.getItem('salesToken')) {
      setAuthed(false);
      return;
    }
    setLoading(true);
    setFetchError('');
    Promise.all([
      getSales({ desde, hasta }),
      getSalesStats({ desde, hasta }),
      getMostSold({ desde, hasta }),
    ])
      .then(([salesRes, statsRes, mostSoldRes]) => {
        setData(salesRes.data);
        setStats(statsRes.data);
        setMostSold(mostSoldRes.data);
      })
      .catch((err) => {
        if (!localStorage.getItem('salesToken')) {
          setAuthed(false);
        } else {
          setFetchError(err.response?.data?.message || 'Error al cargar ventas');
        }
      })
      .finally(() => setLoading(false));
  };

  const handleDailyClose = async () => {
    try {
      const res = await getDailyClose();
      const d = res.data;

      const metodos = [
        { key: 'efectivo', label: 'Efectivo', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        { key: 'transferencia', label: 'Transferencia', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { key: 'tarjeta', label: 'Tarjeta', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
      ];

      const rows = metodos.map((m) => {
        const info = d[m.key] || { total: 0, cantidad: 0 };
        return `
          <div class="flex items-center justify-between ${m.bg} ${m.border} border rounded-lg px-4 py-3">
            <div>
              <p class="text-sm font-medium text-white">${m.label}</p>
              <p class="text-xs text-white/40">${info.cantidad} unidades</p>
            </div>
            <p class="text-lg font-bold ${m.color}">$${Number(info.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
        `;
      }).join('');

      Swal.fire({
        icon: 'success',
        title: `Cierre de Caja`,
        html: `
          <div class="text-left space-y-3" style="max-width: 420px; margin: 0 auto;">
            <div class="text-center mb-4">
              <p class="text-xs text-white/40">${d.fecha}</p>
              <p class="text-3xl font-bold text-white mt-2">$${Number(d.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              <p class="text-xs text-white/40">${d.cantidad} unidades vendidas</p>
            </div>
            <div class="h-px bg-white/10 my-4"></div>
            ${rows}
            <div class="text-center mt-2">
              <p class="text-xs text-white/30">Cierre registrado exitosamente</p>
            </div>
          </div>
        `,
        confirmButtonText: 'Cerrar',
        background: '#171717',
        color: '#fff',
        confirmButtonColor: '#22c55e',
        width: 480,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Error al obtener cierre de caja',
        background: '#171717',
        color: '#fff',
        confirmButtonColor: '#fff',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await Swal.fire({
      icon: 'question',
      title: '¿Eliminar esta venta?',
      text: 'El stock del producto se restaurará automáticamente',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      background: '#171717',
      color: '#fff',
      confirmButtonColor: '#ef4444',
    });
    if (!confirmed.isConfirmed) return;
    try {
      await deleteSale(id);
      Swal.fire({ icon: 'success', title: 'Venta eliminada', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al eliminar venta', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  useEffect(() => {
    if (!authed) return;
    fetchData();
  }, [desde, hasta, authed]);

  const selectPeriodo = (p) => {
    setActivePeriodo(p.key);
    setDesde(p.desde());
    setHasta(p.hasta());
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatMoney = (n) =>
    `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20">
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h1 className="text-xl font-bold text-white mb-2">Acceso a Ventas</h1>
          <p className="text-sm text-white/50 mb-6">Ingrese las credenciales de ventas</p>
          <form onSubmit={handleSalesLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Contrasena</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-400">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-50 transition-all"
            >
              {loginLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {fetchError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {fetchError}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Ventas</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDailyClose}
            className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-all"
          >
            Cierre de Caja
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
          >
            Cerrar sesion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Vendido</p>
          <p className="text-3xl font-bold text-green-400">
            {formatMoney(stats?.total || 0)}
          </p>
          <p className="text-xs text-white/30 mt-1">{stats?.cantidad || 0} unidades</p>
        </div>
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-green-500/20 rounded-xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Efectivo</p>
          <p className="text-2xl font-bold text-white">
            {formatMoney(stats?.efectivo?.total || 0)}
          </p>
          <p className="text-xs text-white/30 mt-1">{stats?.efectivo?.cantidad || 0} unidades</p>
        </div>
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-blue-500/20 rounded-xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Transferencia</p>
          <p className="text-2xl font-bold text-white">
            {formatMoney(stats?.transferencia?.total || 0)}
          </p>
          <p className="text-xs text-white/30 mt-1">{stats?.transferencia?.cantidad || 0} unidades</p>
        </div>
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Tarjeta de Credito</p>
          <p className="text-2xl font-bold text-white">
            {formatMoney(stats?.tarjeta?.total || 0)}
          </p>
          <p className="text-xs text-white/30 mt-1">{stats?.tarjeta?.cantidad || 0} unidades</p>
        </div>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/40 uppercase tracking-wider">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/40 uppercase tracking-wider">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2 ml-auto">
          {periodos.map((p) => (
            <button
              key={p.key}
              onClick={() => selectPeriodo(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activePeriodo === p.key
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4 flex items-center justify-between">
        <p className="text-white/50 text-sm">
          {!desde && !hasta
            ? 'Todas las ventas'
            : `Ventas del ${desde === hasta
              ? new Date(desde).toLocaleDateString('es-AR')
              : `${new Date(desde).toLocaleDateString('es-AR')} al ${new Date(hasta).toLocaleDateString('es-AR')}`}
          `}
        </p>
        <p className="text-2xl font-bold text-green-400">{formatMoney(data.total)}</p>
      </div>

      {mostSold.length > 0 && (
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4">
          <h2 className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Productos mas vendidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mostSold.map((item) => (
              <div key={item.productoId} className="border border-white/5 rounded-lg p-3 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <p className="font-medium text-white text-sm">{item.nombre}</p>
                  <p className="text-xs text-white/30">{item.categoria}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">{formatMoney(item.ingresos)}</p>
                  <p className="text-xs text-white/30">{item.totalVendido} unid.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Producto</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Categoria</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Cantidad</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Precio Unit.</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Total</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Empleado</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Pago</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Fecha</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Accion</th>
            </tr>
          </thead>
          <tbody>
            {data.sales.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-white/30">
                  No hay ventas en este periodo
                </td>
              </tr>
            ) : (
              data.sales.map((s) => (
                <tr key={s._id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{s.producto?.nombre}</td>
                  <td className="px-4 py-3 text-white/50">{s.producto?.categoria || '—'}</td>
                  <td className="px-4 py-3 text-white">{s.cantidad}</td>
                  <td className="px-4 py-3 text-white/50">{formatMoney(s.precio)}</td>
                  <td className="px-4 py-3 text-white font-medium">{formatMoney(s.total)}</td>
                  <td className="px-4 py-3 text-white/50">{s.empleado}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.metodoPago === 'efectivo' ? 'bg-green-500/20 text-green-400' :
                      s.metodoPago === 'transferencia' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {s.metodoPago === 'efectivo' ? 'Efectivo' : s.metodoPago === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="text-red-400 hover:text-red-300 text-xs border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
