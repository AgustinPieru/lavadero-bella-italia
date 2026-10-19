import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Vehiculo, Cliente } from '@/features/clientes/api/useClientes';
import type { Servicio } from '@/features/servicios/api/useServicios';

export type EstadoResena = 'PENDIENTE' | 'APROBADA' | 'OCULTA';

export interface Resena {
  id: number;
  turnoId: number;
  puntaje: number;
  comentario: string | null;
  estado: EstadoResena;
  createdAt: string;
  turno: {
    id: number;
    fecha: string;
    vehiculo: Vehiculo & { cliente: Cliente };
    servicio: Servicio;
  };
}

export function useResenas(estado?: EstadoResena) {
  return useQuery({
    queryKey: ['resenas', estado],
    queryFn: async () => (await api.get<Resena[]>('/resenas', { params: { estado } })).data,
  });
}

function useInvalidateResenas() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['resenas'] });
}

export function useAprobarResena() {
  const invalidate = useInvalidateResenas();
  return useMutation({
    mutationFn: async (id: number) => (await api.patch<Resena>(`/resenas/${id}/aprobar`)).data,
    onSuccess: invalidate,
  });
}

export function useOcultarResena() {
  const invalidate = useInvalidateResenas();
  return useMutation({
    mutationFn: async (id: number) => (await api.patch<Resena>(`/resenas/${id}/ocultar`)).data,
    onSuccess: invalidate,
  });
}

// ── Para el turnero público (franja de reseñas, solo lectura) ──

export interface ResenaPublica {
  id: number;
  puntaje: number;
  comentario: string | null;
  createdAt: string;
  turno: { vehiculo: { tipo: 'CAMION' | 'AUTO' } };
}

export function useResenasPublicas() {
  return useQuery({
    queryKey: ['resenas-publicas'],
    queryFn: async () => (await api.get<ResenaPublica[]>('/resenas/publicas')).data,
  });
}

// ── Encuesta pública (sin login) ──

export interface EncuestaTurno {
  id: number;
  fecha: string;
  vehiculo: Vehiculo & { cliente: Cliente };
  servicio: Servicio;
  resena: { id: number } | null;
}

export function useEncuesta(token: string | undefined) {
  return useQuery({
    queryKey: ['encuesta', token],
    queryFn: async () => (await api.get<EncuestaTurno>(`/resenas/encuesta/${token}`)).data,
    enabled: !!token,
    retry: false,
  });
}

export function useResponderEncuesta(token: string | undefined) {
  return useMutation({
    mutationFn: async (data: { puntaje: number; comentario?: string }) =>
      (await api.post<Resena>(`/resenas/encuesta/${token}`, data)).data,
  });
}
