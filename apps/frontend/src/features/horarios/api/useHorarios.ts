import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export type ModoSlot = 'CAMION' | 'AUTO' | 'LIBRE' | 'CERRADO';

export interface HorarioDia {
  id: number;
  diaSemana: number; // 0=domingo..6=sábado
  abierto: boolean;
  desde: string;
  hasta: string;
  modos: Record<string, ModoSlot>;
  lineaBHabilitada: boolean;
  lineaBDesde: string | null;
  lineaBHasta: string | null;
  modosLineaB: Record<string, ModoSlot> | null;
}

export type HorarioDiaInput = Omit<HorarioDia, 'id' | 'diaSemana'>;

export function useHorarios() {
  return useQuery({
    queryKey: ['horarios'],
    queryFn: async () => (await api.get<HorarioDia[]>('/horarios')).data,
  });
}

export function useUpdateHorarioDia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dia, data }: { dia: number; data: HorarioDiaInput }) =>
      (await api.put<HorarioDia>(`/horarios/${dia}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['horarios'] }),
  });
}
