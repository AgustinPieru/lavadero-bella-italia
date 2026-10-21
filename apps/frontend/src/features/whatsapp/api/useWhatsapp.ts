import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface EstadoWhatsapp {
  habilitado: boolean;
  conectado: boolean;
  numero: string | null;
  nombre: string | null;
  qrDataUrl: string | null;
}

export function useEstadoWhatsapp() {
  return useQuery({
    queryKey: ['whatsapp-estado'],
    queryFn: async () => (await api.get<EstadoWhatsapp>('/whatsapp/estado')).data,
    // Polling: mientras no está conectado hay que ver el QR renovarse solo
    // (vence cada ~20-30s); una vez conectado alcanza con revisar de vez en
    // cuando por si se cae la sesión.
    refetchInterval: (query) => (query.state.data?.conectado ? 15000 : 4000),
  });
}

export function useReconectarWhatsapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<EstadoWhatsapp>('/whatsapp/reconectar')).data,
    onSuccess: (data) => qc.setQueryData(['whatsapp-estado'], data),
  });
}

// A diferencia de reconectar (que solo reinicia la conexión y vuelve a
// entrar con la misma sesión guardada), esto desvincula de verdad el
// número — el próximo arranque pide un QR nuevo.
export function useDesvincularWhatsapp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<EstadoWhatsapp>('/whatsapp/desvincular')).data,
    onSuccess: (data) => qc.setQueryData(['whatsapp-estado'], data),
  });
}
