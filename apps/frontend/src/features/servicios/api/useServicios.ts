import { useQuery } from '@tanstack/react-query';
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

export function useServicios(vehiculo?: VehiculoTipo, subtipo?: string) {
  return useQuery({
    queryKey: ['servicios', vehiculo, subtipo],
    queryFn: async () =>
      (await api.get<Servicio[]>('/servicios', { params: { vehiculo, subtipo } })).data,
    enabled: !!vehiculo && !!subtipo,
  });
}

export function useSubtipos(vehiculo?: VehiculoTipo) {
  return useQuery({
    queryKey: ['servicios-subtipos', vehiculo],
    queryFn: async () => (await api.get<string[]>(`/servicios/subtipos/${vehiculo}`)).data,
    enabled: !!vehiculo,
  });
}
