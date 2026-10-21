import { Box, Typography, Card, CardContent, Stack, Button, CircularProgress, Alert, Chip } from '@mui/material';
import { CheckCircle as CheckCircleIcon, WhatsApp as WhatsAppIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useEstadoWhatsapp, useReconectarWhatsapp, useDesvincularWhatsapp } from '../api/useWhatsapp';

export default function WhatsappEstadoPage() {
  const { data: estado, isLoading } = useEstadoWhatsapp();
  const reconectar = useReconectarWhatsapp();
  const desvincular = useDesvincularWhatsapp();
  // Nota: se probó pedir un QR fresco solo al entrar a la pantalla, pero
  // reconectar() siempre tira la sesión actual primero — si se dispara en
  // un momento en que el estado en caché todavía decía "desconectado" pero
  // en los hechos ya se había logrado vincular, cortaba una sesión buena.
  // Mejor dejar el pedido de QR 100% a mano (botón de abajo).

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} mb={0.5}>
        WhatsApp
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Se usa para mandar la confirmación de turnos y la encuesta de reseñas. Una vez vinculado el número, queda
        conectado indefinidamente (solo hay que repetir esto si el celular pasa más de 14 días sin internet, o si se
        desvincula el dispositivo a mano desde WhatsApp).
      </Typography>

      <Card sx={{ maxWidth: 480 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {isLoading || !estado ? (
            <Box py={4}>
              <CircularProgress />
            </Box>
          ) : !estado.habilitado ? (
            <Alert severity="info" sx={{ textAlign: 'left' }}>
              WhatsApp todavía no está habilitado. Falta setear <code>WHATSAPP_ENABLED=true</code> en el .env del
              backend y reiniciar el servidor.
            </Alert>
          ) : estado.conectado ? (
            <>
              <CheckCircleIcon color="success" sx={{ fontSize: 56, mb: 1 }} />
              <Typography variant="h6" fontWeight={800} mb={0.5}>
                Conectado
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" mb={3} flexWrap="wrap">
                {estado.nombre && <Chip label={estado.nombre} size="small" />}
                {estado.numero && <Chip label={`+${estado.numero}`} size="small" variant="outlined" />}
              </Stack>
              <Button
                variant="outlined"
                color="error"
                startIcon={<RefreshIcon />}
                onClick={() => desvincular.mutate()}
                disabled={desvincular.isPending}
              >
                {desvincular.isPending ? 'Desvinculando...' : 'Desvincular y generar otro QR'}
              </Button>
              <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                Usalo solo si querés cambiar el número vinculado — desvincula el dispositivo de verdad (se saca de la
                lista del celular) y pide un QR nuevo.
              </Typography>
            </>
          ) : (
            <>
              <WhatsAppIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" fontWeight={800} mb={1}>
                No vinculado
              </Typography>
              {estado.qrDataUrl && !reconectar.isPending ? (
                <Box
                  component="img"
                  src={estado.qrDataUrl}
                  alt="QR para vincular WhatsApp"
                  sx={{ width: 240, height: 240, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}
                />
              ) : (
                <Box sx={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <CircularProgress size={28} />
                </Box>
              )}
              <Typography variant="body2" color="text.secondary" mb={2}>
                En el celular del lavadero: WhatsApp → Ajustes → Dispositivos vinculados → Vincular un dispositivo, y
                escaneá este código. Si tardaste en escanear puede haber vencido — pedí uno nuevo antes de intentar.
              </Typography>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => reconectar.mutate()}
                disabled={reconectar.isPending}
              >
                {reconectar.isPending ? 'Generando...' : 'Generar QR nuevo'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
