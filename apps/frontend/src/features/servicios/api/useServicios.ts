import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { VehiculoTipo } from '@/features/clientes/api/useClientes';

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  vehiculo: VehiculoTipo;
  subtipo: string;
  precio: number;
  activo: boolean;
}

export interface ServicioInput {
  nombre: string;
  descripcion?: string;
  vehiculo: VehiculoTipo;
  subtipo: string;
  precio: number;
}

export function useServicios(vehiculo?: VehiculoTipo, subtipo?: string) {
  return useQuery({
    queryKey: ['servicios', vehiculo, subtipo],
    queryFn: async () =>
      (await api.get<Servicio[]>('/servicios', { params: { vehiculo, subtipo } })).data,
    enabled: !!vehiculo && !!subtipo,
  });
}

// Lista completa (incluye inactivos) para la pantalla de ABM.
export function useServiciosAdmin() {
  return useQuery({
    queryKey: ['servicios-admin'],
    queryFn: async () => (await api.get<Servicio[]>('/servicios', { params: { admin: true } })).data,
  });
}

export function useSubtipos(vehiculo?: VehiculoTipo) {
  return useQuery({
    queryKey: ['servicios-subtipos', vehiculo],
    queryFn: async () => (await api.get<string[]>(`/servicios/subtipos/${vehiculo}`)).data,
    enabled: !!vehiculo,
  });
}

function useInvalidateServicios() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['servicios'] });
    qc.invalidateQueries({ queryKey: ['servicios-admin'] });
    qc.invalidateQueries({ queryKey: ['servicios-subtipos'] });
  };
}

export function useCreateServicio() {
  const invalidate = useInvalidateServicios();
  return useMutation({
    mutationFn: async (data: ServicioInput) => (await api.post<Servicio>('/servicios', data)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateServicio() {
  const invalidate = useInvalidateServicios();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ServicioInput }) =>
      (await api.put<Servicio>(`/servicios/${id}`, data)).data,
    onSuccess: invalidate,
  });
}

export function useUpdatePrecio() {
  const invalidate = useInvalidateServicios();
  return useMutation({
    mutationFn: async ({ id, precio }: { id: number; precio: number }) =>
      (await api.patch<Servicio>(`/servicios/${id}/precio`, { precio })).data,
    onSuccess: invalidate,
  });
}

export function useDesactivarServicio() {
  const invalidate = useInvalidateServicios();
  return useMutation({
    mutationFn: async (id: number) => (await api.patch<Servicio>(`/servicios/${id}/desactivar`)).data,
    onSuccess: invalidate,
  });
}

export function useReactivarServicio() {
  const invalidate = useInvalidateServicios();
  return useMutation({
    mutationFn: async (id: number) => (await api.patch<Servicio>(`/servicios/${id}/reactivar`)).data,
    onSuccess: invalidate,
  });
}
