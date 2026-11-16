import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export type MedioPago = 'CUENTA' | 'EFECTIVO';

export interface SaldoCaja {
  configurado: boolean;
  fechaDesde: string | null;
  cuenta: number;
  efectivo: number;
  total: number;
  sinClasificar: number;
}

export interface SaldoInicialInput {
  fecha: string;
  cuenta: number;
  efectivo: number;
}

const CAJA_KEY = ['caja'] as const;

export function useSaldoCaja() {
  return useQuery({
    queryKey: CAJA_KEY,
    queryFn: async () => (await api.get<SaldoCaja>('/caja')).data,
  });
}

export function useSetSaldoInicial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: SaldoInicialInput) => (await api.put<SaldoCaja>('/caja/saldo-inicial', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: CAJA_KEY }),
  });
}
