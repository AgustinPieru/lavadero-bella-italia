import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface Reporte {
  lavadosPorDia: { label: string; cantidad: number }[];
  ingresos: number;
  gastosTotal: number;
  gastosPorCategoria: Record<string, number>;
  porFormaPago: Record<string, { cantidad: number; monto: number }>;
  topEmpresas: { nombre: string; lavados: number; monto: number }[];
  camiones: number;
  autos: number;
  totalCount: number;
  completadosCount: number;
  canceladosCount: number;
}

export function useReporte(desde: string, hasta: string) {
  return useQuery({
    queryKey: ['reporte', desde, hasta],
    queryFn: async () => (await api.get<Reporte>('/reportes', { params: { desde, hasta } })).data,
    enabled: !!desde && !!hasta,
  });
}

export function useDescargarReportePdf() {
  return useMutation({
    mutationFn: async ({ desde, hasta }: { desde: string; hasta: string }) => {
      const res = await api.get('/reportes/pdf', { params: { desde, hasta }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${desde}-a-${hasta}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  });
}
