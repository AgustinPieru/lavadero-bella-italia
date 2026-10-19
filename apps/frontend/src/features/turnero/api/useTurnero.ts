import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { VehiculoTipo } from '@/features/clientes/api/useClientes';
import type { FormaPago, Turno } from '@/features/turnos/api/useTurnos';

export interface EmpresaPublica {
  id: number;
  denominacion: string;
}

export function useEmpresasPublicas() {
  return useQuery({
    queryKey: ['turnero-empresas'],
    queryFn: async () => (await api.get<EmpresaPublica[]>('/turnero/empresas')).data,
  });
}

export interface SlotDisponible {
  hora: string;
  linea: 'A' | 'B';
  disponible: boolean;
}

export function useDisponibilidad(fecha: string, vehiculo?: VehiculoTipo) {
  return useQuery({
    queryKey: ['turnero-disponibilidad', fecha, vehiculo],
    queryFn: async () => (await api.get<{ abierto: boolean; slots: SlotDisponible[] }>('/turnero/disponibilidad', { params: { fecha, vehiculo } })).data,
    enabled: !!fecha && !!vehiculo,
  });
}

export interface ReservarTurnoInput {
  vehiculoTipo: VehiculoTipo;
  subtipo: string;
  servicioId: number;
  fecha: string;
  hora: string;
  denominacion: string;
  telefono: string;
  cuit?: string;
  marca?: string;
  modelo?: string;
  patente: string;
  empresaId?: number;
  formaPago: FormaPago;
}

export function useReservarTurno() {
  return useMutation({
    mutationFn: async (data: ReservarTurnoInput) => (await api.post<Turno>('/turnero/reservar', data)).data,
  });
}
