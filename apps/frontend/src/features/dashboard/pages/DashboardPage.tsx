import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { useAuth } from '@/features/auth/hooks/useAuthContext';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
};

// Placeholder de la Etapa 2 (login) — se reemplaza por la Agenda del día
// cuando lleguemos a la Etapa 3a.
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Hola, {user?.name}
      </Typography>
      <Card sx={{ maxWidth: 420, mt: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Email
          </Typography>
          <Typography fontWeight={600} mb={2}>
            {user?.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rol
          </Typography>
          <Chip label={user ? ROLE_LABEL[user.role] ?? user.role : ''} color="primary" size="small" sx={{ mt: 0.5 }} />
        </CardContent>
      </Card>
    </Box>
  );
}
