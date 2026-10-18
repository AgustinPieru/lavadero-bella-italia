import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Cliente, Vehiculo } from '@/features/clientes/api/useClientes';
import type { Servicio } from '@/features/servicios/api/useServicios';

export type Linea = 'A' | 'B';
export type EstadoTurno = 'RESERVADO' | 'COMPLETADO' | 'CANCELADO';
export type FormaPago = 'CONTADO' | 'TRANSFERENCIA' | 'EFECTIVO' | 'CUENTA_CORRIENTE';

export interface Turno {
  id: number;
  fecha: string;
  hora: string;
  linea: Linea;
  vehiculoId: number;
  servicioId: number;
  estado: EstadoTurno;
  formaPago: FormaPago;
  pagado: boolean;
  facturar: boolean;
  vehiculo: Vehiculo & { cliente: Cliente };
  servicio: Servicio;
}

export interface TurnoInput {
  fecha: string;
  hora: string;
  linea: Linea;
  vehiculoId: number;
  servicioId: number;
  formaPago: FormaPago;
  pagado: boolean;
  facturar: boolean;
}

function turnosKey(fecha: string) {
  return ['turnos', fecha] as const;
}

export function useTurnosDelDia(fecha: string) {
  return useQuery({
    queryKey: turnosKey(fecha),
    queryFn: async () => (await api.get<Turno[]>('/turnos', { params: { fecha } })).data,
  });
}

function useInvalidateTurnos(fecha: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: turnosKey(fecha) });
}

export function useCreateTurno(fecha: string) {
  const invalidate = useInvalidateTurnos(fecha);
  return useMutation({
    mutationFn: async (data: TurnoInput) => (await api.post<Turno>('/turnos', data)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateTurno(fecha: string) {
  const invalidate = useInvalidateTurnos(fecha);
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<TurnoInput, 'fecha'> }) =>
      (await api.put<Turno>(`/turnos/${id}`, data)).data,
    onSuccess: invalidate,
  });
}

function useTurnoAction(fecha: string, action: string) {
  const invalidate = useInvalidateTurnos(fecha);
  return useMutation({
    mutationFn: async (id: number) => (await api.patch<Turno>(`/turnos/${id}/${action}`)).data,
    onSuccess: invalidate,
  });
}

export function useCompletarTurno(fecha: string) {
  return useTurnoAction(fecha, 'completar');
}
export function useReabrirTurno(fecha: string) {
  return useTurnoAction(fecha, 'reabrir');
}
export function useCancelarTurno(fecha: string) {
  return useTurnoAction(fecha, 'cancelar');
}
export function useTogglePago(fecha: string) {
  return useTurnoAction(fecha, 'pago');
}
export function useToggleFacturar(fecha: string) {
  return useTurnoAction(fecha, 'facturar');
}
