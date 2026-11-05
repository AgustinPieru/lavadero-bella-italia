import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Cliente, TipoFacturacion, Vehiculo } from '@/features/clientes/api/useClientes';
import { FormaPago } from '@/features/turnos/api/useTurnos';
import { Servicio } from '@/features/servicios/api/useServicios';

export type EstadoFactura = 'PENDIENTE' | 'PAGADA';

export interface FacturaTurno {
  id: number;
  hora: string;
  precioNeto: number;
  vehiculo: Vehiculo;
  servicio: Servicio;
}

export interface Factura {
  id: number;
  numero: string;
  fecha: string;
  clienteId: number;
  comprobante: TipoFacturacion;
  facturar: boolean;
  neto: number;
  iva: number;
  total: number;
  formaPago: FormaPago;
  estado: EstadoFactura;
  cae: string | null;
  caeFchVto: string | null;
  puntoVenta: number | null;
  numeroArca: number | null;
  cliente: Cliente;
  turnos: FacturaTurno[];
}

// "Con factura" es un comprobante real (con IVA), solo le falta el
// timbrado de ARCA. "Sin factura" son los turnos que se marcaron "No
// factura" en el cierre diario — se cobran igual pero nunca fueron una
// factura de verdad, por eso no comparten el mismo rótulo aunque ambos
// queden guardados como Factura internamente (ver cerrarDiario).
export function comprobanteLabel(f: Pick<Factura, 'comprobante' | 'facturar'>): string {
  if (f.comprobante === 'ARCA') return 'ARCA';
  return f.facturar ? 'Con factura' : 'Sin factura';
}

export function comprobanteColor(f: Pick<Factura, 'comprobante' | 'facturar'>): 'success' | 'default' | 'warning' {
  if (f.comprobante === 'ARCA') return 'success';
  return f.facturar ? 'default' : 'warning';
}

// Para listar: un cliente con turnos facturados y no facturados el mismo
// día tiene DOS Facturas en la base (ver cerrarDiario, por el IVA), pero en
// pantalla tienen que verse como UN solo registro — si no, da la impresión
// de que son dos órdenes de trabajo separadas cuando en realidad se
// mandan/descargan consolidadas (ver OrdenTrabajo más abajo). anchorId es
// cualquiera de los ids del grupo: alcanza para pedir la orden consolidada.
export interface FacturaGrupo {
  clienteId: number;
  cliente: Cliente;
  fecha: string;
  facturas: Factura[];
  totalTurnos: number;
  total: number;
  estado: EstadoFactura;
  anchorId: number;
}

export function agruparFacturasPorClienteYDia(facturas: Factura[]): FacturaGrupo[] {
  const grupos = new Map<string, FacturaGrupo>();
  facturas.forEach((f) => {
    const key = `${f.clienteId}:${f.fecha}`;
    const g = grupos.get(key);
    if (g) {
      g.facturas.push(f);
      g.totalTurnos += f.turnos.length;
      g.total += f.total;
      if (f.estado === 'PENDIENTE') g.estado = 'PENDIENTE';
    } else {
      grupos.set(key, {
        clienteId: f.clienteId,
        cliente: f.cliente,
        fecha: f.fecha,
        facturas: [f],
        totalTurnos: f.turnos.length,
        total: f.total,
        estado: f.estado,
        anchorId: f.id,
      });
    }
  });
  return Array.from(grupos.values());
}

export function useFacturas(params: { fecha?: string; clienteId?: number } = {}) {
  return useQuery({
    queryKey: ['facturas', params],
    queryFn: async () => (await api.get<Factura[]>('/facturas', { params })).data,
  });
}

export function useFactura(id?: number) {
  return useQuery({
    queryKey: ['factura', id],
    queryFn: async () => (await api.get<Factura>(`/facturas/${id}`)).data,
    enabled: !!id,
  });
}

// Todos los lavados de un cliente en un día, consolidados sin importar en
// cuántas Facturas hayan quedado repartidos (ver
// facturas.service.ts#getOrdenTrabajoDelDia) — es lo mismo que se manda por
// WhatsApp o se descarga como PDF, para que el detalle en pantalla sea
// siempre igual a lo que termina recibiendo el cliente.
export interface OrdenTrabajo {
  fecha: string;
  cliente: Cliente;
  turnos: FacturaTurno[];
  neto: number;
  iva: number;
  total: number;
  facturas: Factura[];
}

export function useOrdenTrabajo(facturaId?: number) {
  return useQuery({
    queryKey: ['orden-trabajo', facturaId],
    queryFn: async () => (await api.get<OrdenTrabajo>(`/facturas/${facturaId}/orden-trabajo`)).data,
    enabled: !!facturaId,
  });
}

export function useSaldoPendiente(clienteId?: number) {
  return useQuery({
    queryKey: ['saldo-pendiente', clienteId],
    queryFn: async () => (await api.get<{ saldo: number }>(`/facturas/saldo/${clienteId}`)).data.saldo,
    enabled: !!clienteId,
  });
}

function useInvalidateFacturas() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['facturas'] });
    qc.invalidateQueries({ queryKey: ['factura'] });
    qc.invalidateQueries({ queryKey: ['orden-trabajo'] });
    qc.invalidateQueries({ queryKey: ['saldo-pendiente'] });
  };
}

export function useCerrarDiario() {
  const invalidate = useInvalidateFacturas();
  const qc = useQueryClient();
  return useMutation({
    // Sin body (undefined, no null): un body literal "null" llega como JSON
    // inválido para el parser estricto de Express y el POST falla con 400.
    mutationFn: async (fecha: string) => (await api.post<Factura[]>(`/facturas/cierre-diario`, undefined, { params: { fecha } })).data,
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['turnos'] });
    },
  });
}

export function useMarcarPagada() {
  const invalidate = useInvalidateFacturas();
  return useMutation({
    mutationFn: async (id: number) => (await api.patch<Factura>(`/facturas/${id}/pagar`)).data,
    onSuccess: invalidate,
  });
}

export function useEmitirEnArca() {
  const invalidate = useInvalidateFacturas();
  return useMutation({
    mutationFn: async (id: number) => (await api.post<Factura>(`/facturas/${id}/emitir-arca`)).data,
    onSuccess: invalidate,
  });
}

export function useDescargarOrdenTrabajo() {
  return useMutation({
    mutationFn: async ({ facturaId, fecha }: { facturaId: number; fecha: string }) => {
      const res = await api.get(`/facturas/${facturaId}/orden-trabajo.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orden-trabajo-${fecha.slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  });
}

export function useEnviarOrdenTrabajo() {
  const invalidate = useInvalidateFacturas();
  return useMutation({
    mutationFn: async (id: number) => (await api.post<Factura>(`/facturas/${id}/orden-trabajo/enviar`)).data,
    onSuccess: invalidate,
  });
}
