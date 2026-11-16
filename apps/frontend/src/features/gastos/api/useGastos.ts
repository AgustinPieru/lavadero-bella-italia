import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export type CategoriaGasto = 'SUELDOS' | 'IMPUESTOS' | 'SERVICIOS' | 'INSUMOS' | 'OTRO';
export type MedioPago = 'CUENTA' | 'EFECTIVO';

export interface Gasto {
  id: number;
  fecha: string;
  categoria: CategoriaGasto;
  monto: number;
  descripcion: string | null;
  medioPago: MedioPago | null;
  createdAt: string;
}

export interface GastoInput {
  fecha: string;
  categoria: CategoriaGasto;
  monto: number;
  descripcion?: string;
  medioPago: MedioPago;
}

function gastosKey(fecha: string) {
  return ['gastos', fecha] as const;
}

export function useGastosDelDia(fecha: string) {
  return useQuery({
    queryKey: gastosKey(fecha),
    queryFn: async () => (await api.get<Gasto[]>('/gastos', { params: { fecha } })).data,
  });
}

export function useCreateGasto(fecha: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: GastoInput) => (await api.post<Gasto>('/gastos', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: gastosKey(fecha) }),
  });
}

export function useDeleteGasto(fecha: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/gastos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: gastosKey(fecha) }),
  });
}
