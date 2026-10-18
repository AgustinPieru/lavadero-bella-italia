import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Chip, Container, Stack, Typography } from '@mui/material';

type CheckStatus = 'checking' | 'ok' | 'error';

function StatusRow({ label, status, detail }: { label: string; status: CheckStatus; detail?: string }) {
  const chip =
    status === 'checking' ? (
      <Chip label="Verificando..." size="small" />
    ) : status === 'ok' ? (
      <Chip label="OK" color="success" size="small" />
    ) : (
      <Chip label="Error" color="error" size="small" />
    );
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box>
        <Typography fontWeight={700}>{label}</Typography>
        {detail && (
          <Typography variant="body2" color="text.secondary">
            {detail}
          </Typography>
        )}
      </Box>
      {chip}
    </Stack>
  );
}

// Etapa 1: pantalla de verificación del scaffolding — confirma que el
// frontend llega al backend y que el backend llega a la base de datos.
// Se reemplaza por el router real (login + panel) en la Etapa 2.
export default function App() {
  const [apiStatus, setApiStatus] = useState<CheckStatus>('checking');
  const [dbStatus, setDbStatus] = useState<CheckStatus>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? setApiStatus('ok') : setApiStatus('error')))
      .catch(() => setApiStatus('error'));

    fetch('/api/health/db')
      .then((r) => (r.ok ? setDbStatus('ok') : setDbStatus('error')))
      .catch(() => setDbStatus('error'));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
      <Container maxWidth="sm">
        <Stack spacing={1} alignItems="center" sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '2.5px solid',
              borderColor: 'primary.dark',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            🚛
          </Box>
          <Typography variant="h5" fontWeight={800} color="primary.dark">
            Bella Italia
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Etapa 1 — scaffolding del proyecto
          </Typography>
        </Stack>

        <Card>
          <CardContent>
            <StatusRow label="Frontend (React + Vite)" status="ok" detail="Esta pantalla se está renderizando" />
            <StatusRow label="Backend (Express API)" status={apiStatus} detail="GET /api/health" />
            <StatusRow label="Base de datos (Postgres)" status={dbStatus} detail="GET /api/health/db vía Prisma" />
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
