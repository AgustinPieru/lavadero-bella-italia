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
