import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export type VehiculoTipo = 'CAMION' | 'AUTO';

export interface Cliente {
  id: number;
  denominacion: string;
  telefono: string;
  cuit: string | null;
  email: string | null;
  direccion: string | null;
  vehiculo: VehiculoTipo;
  subtipo: string;
  marca: string | null;
  modelo: string | null;
  patente: string | null;
}

export interface CreateClienteInput {
  denominacion: string;
  telefono: string;
  cuit?: string;
  email?: string;
  direccion?: string;
  vehiculo: VehiculoTipo;
  subtipo: string;
  marca?: string;
  modelo?: string;
  patente?: string;
}

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => (await api.get<Cliente[]>('/clientes')).data,
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClienteInput) => (await api.post<Cliente>('/clientes', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}
