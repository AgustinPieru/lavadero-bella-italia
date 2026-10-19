import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Stack, IconButton, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material';
import { useEncuesta, useResponderEncuesta } from '../api/useResenas';
import { formatFechaAgenda } from '@/lib/format';

export default function EncuestaPage() {
  const { token } = useParams<{ token: string }>();
  const { data: turno, isLoading, isError } = useEncuesta(token);
  const responder = useResponderEncuesta(token);
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState('');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                bgcolor: 'background.paper',
                border: '2.5px solid',
                borderColor: 'primary.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
              }}
            >
              🚛
            </Box>
            <Typography variant="h6" fontWeight={800}>
              Lavadero Bella Italia
            </Typography>
          </Stack>

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : isError || !turno ? (
            <Alert severity="error">Este link de encuesta no es válido.</Alert>
          ) : turno.resena ? (
            <Alert severity="success">¡Gracias! Ya registramos tu reseña para este lavado.</Alert>
          ) : responder.isSuccess ? (
            <Alert severity="success">¡Gracias por tu feedback! Nos ayuda un montón a mejorar.</Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" mb={0.5}>
                {turno.vehiculo.cliente.denominacion} · {turno.vehiculo.tipo === 'CAMION' ? '🚛' : '🚗'} {turno.vehiculo.subtipo}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {turno.servicio.nombre} — {formatFechaAgenda(new Date(turno.fecha))}
              </Typography>

              <Typography fontWeight={700} mb={1}>
                ¿Cómo te fue con el servicio?
              </Typography>
              <Stack direction="row" spacing={0.5} mb={3}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <IconButton key={n} onClick={() => setPuntaje(n)} sx={{ color: '#d4a017' }}>
                    {n <= puntaje ? <StarIcon fontSize="large" /> : <StarBorderIcon fontSize="large" />}
                  </IconButton>
                ))}
              </Stack>

              <TextField
                label="Comentario (opcional)"
                multiline
                minRows={3}
                fullWidth
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Contanos cómo te atendimos"
                sx={{ mb: 2 }}
              />

              {responder.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  No se pudo enviar tu reseña. Probá de nuevo.
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={puntaje === 0 || responder.isPending}
                onClick={() => responder.mutate({ puntaje, comentario: comentario.trim() || undefined })}
              >
                Enviar
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
