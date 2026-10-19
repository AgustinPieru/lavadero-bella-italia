import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Cliente, TipoFacturacion } from '@/features/clientes/api/useClientes';

export interface EmpresaDataInput {
  descuentoPct?: number;
  facturacion: TipoFacturacion;
  cuentaCorrienteHabilitada: boolean;
}

export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: async () => (await api.get<Cliente[]>('/clientes/empresas')).data,
  });
}

function useInvalidateEmpresas() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['empresas'] });
    qc.invalidateQueries({ queryKey: ['clientes'] });
  };
}

export function useMarcarComoEmpresa() {
  const invalidate = useInvalidateEmpresas();
  return useMutation({
    mutationFn: async ({ clienteId, data }: { clienteId: number; data: EmpresaDataInput }) =>
      (await api.patch<Cliente>(`/clientes/${clienteId}/empresa`, data)).data,
    onSuccess: invalidate,
  });
}

export function useActualizarEmpresa() {
  const invalidate = useInvalidateEmpresas();
  return useMutation({
    mutationFn: async ({ clienteId, data }: { clienteId: number; data: EmpresaDataInput }) =>
      (await api.put<Cliente>(`/clientes/${clienteId}/empresa`, data)).data,
    onSuccess: invalidate,
  });
}

export function useQuitarEmpresa() {
  const invalidate = useInvalidateEmpresas();
  return useMutation({
    mutationFn: async (clienteId: number) => (await api.patch<Cliente>(`/clientes/${clienteId}/empresa/quitar`)).data,
    onSuccess: invalidate,
  });
}
