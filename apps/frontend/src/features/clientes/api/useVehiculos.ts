import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Vehiculo, VehiculoInput } from './useClientes';

function useInvalidateClientes() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['clientes'] });
}

export function useAddVehiculo(clienteId: number) {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: async (data: VehiculoInput) => (await api.post<Vehiculo>(`/clientes/${clienteId}/vehiculos`, data)).data,
    onSuccess: invalidate,
  });
}

export function useUpdateVehiculo(clienteId: number) {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: VehiculoInput }) =>
      (await api.put<Vehiculo>(`/clientes/${clienteId}/vehiculos/${id}`, data)).data,
    onSuccess: invalidate,
  });
}

export function useDesactivarVehiculo(clienteId: number) {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: async (id: number) => (await api.patch<Vehiculo>(`/clientes/${clienteId}/vehiculos/${id}/desactivar`)).data,
    onSuccess: invalidate,
  });
}

export function useReactivarVehiculo(clienteId: number) {
  const invalidate = useInvalidateClientes();
  return useMutation({
    mutationFn: async (id: number) => (await api.patch<Vehiculo>(`/clientes/${clienteId}/vehiculos/${id}/reactivar`)).data,
    onSuccess: invalidate,
  });
}
