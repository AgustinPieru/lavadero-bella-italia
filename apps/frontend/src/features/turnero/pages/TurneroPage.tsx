import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import {
  useSubtipos,
  useServicios,
  Servicio,
} from "@/features/servicios/api/useServicios";
import type { VehiculoTipo } from "@/features/clientes/api/useClientes";
import type { FormaPago } from "@/features/turnos/api/useTurnos";
import {
  useDisponibilidad,
  useEmpresasPublicas,
  useReservarTurno,
} from "../api/useTurnero";
import { useResenasPublicas } from "@/features/resenas/api/useResenas";
import SiteFooter from "@/components/SiteFooter";
import Logo from "@/components/Logo";
import { isoDate, formatPesos } from "@/lib/format";

const FORMA_PAGO_LABEL: Record<FormaPago, string> = {
  CONTADO: "Contado",
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  CUENTA_CORRIENTE: "Cuenta corriente",
};

const DOW_SHORT = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const DOW_LONG = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function buildDias(count: number) {
  const base = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    return { date: d, iso: isoDate(d), isToday: i === 0 };
  });
}
const DIAS = buildDias(21);

function formatDiaLabel(d: { date: Date; isToday: boolean }) {
  if (d.isToday) return "Hoy";
  const dow = DOW_LONG[d.date.getDay()].replace(/^./, (c) => c.toUpperCase());
  return `${dow} ${d.date.getDate()} de ${MONTHS[d.date.getMonth()]}`;
}

interface BookingState {
  vehiculoTipo?: VehiculoTipo;
  subtipo?: string;
  servicioId?: number;
  diaIso: string;
  hora?: string;
  denominacion: string;
  telefono: string;
  cuit: string;
  marca: string;
  modelo: string;
  patente: string;
  empresaId: number | "";
  formaPago: FormaPago | "";
}

const BOOKING_INICIAL: BookingState = {
  // El lavadero trabaja mayormente con camiones — arranca preseleccionado
  // para no obligar a un clic de más en el caso más común.
  vehiculoTipo: "CAMION",
  diaIso: DIAS[0].iso,
  denominacion: "",
  telefono: "",
  cuit: "",
  marca: "",
  modelo: "",
  patente: "",
  empresaId: "",
  formaPago: "",
};

// Datos del cliente/vehículo recordados en este dispositivo (localStorage)
// para no tener que volver a tipearlos en la próxima visita — igual que en
// la demo ("te reconocimos en este dispositivo"). Nunca se guarda nada del
// turno en sí (fecha/hora/servicio), solo los datos de quien reserva.
const STORAGE_KEY = "bellaitalia_turnero_cliente";

type ClienteGuardado = Pick<
  BookingState,
  | "denominacion"
  | "telefono"
  | "cuit"
  | "marca"
  | "modelo"
  | "patente"
  | "empresaId"
  | "formaPago"
>;

function cargarClienteGuardado(): ClienteGuardado | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function guardarClienteGuardado(data: ClienteGuardado) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage puede no estar disponible (modo privado, etc.) — no es crítico
  }
}

function ResenasStrip() {
  const { data: resenas } = useResenasPublicas();
  if (!resenas || resenas.length === 0) return null;
  const promedio = resenas.reduce((a, r) => a + r.puntaje, 0) / resenas.length;
  const conComentario = resenas.filter((r) => r.comentario).slice(0, 3);

  return (
    <Card sx={{ mt: 4, bgcolor: "background.default" }}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          mb={conComentario.length ? 1.5 : 0}
        >
          <Stack direction="row" sx={{ color: "#d4a017" }}>
            {[1, 2, 3, 4, 5].map((n) =>
              n <= Math.round(promedio) ? (
                <StarIcon key={n} fontSize="small" />
              ) : (
                <StarBorderIcon key={n} fontSize="small" />
              ),
            )}
          </Stack>
          <Typography fontWeight={700}>{promedio.toFixed(1)}</Typography>
          <Typography variant="caption" color="text.secondary">
            ({resenas.length} reseñas de clientes)
          </Typography>
        </Stack>
        {conComentario.map((r) => (
          <Typography
            key={r.id}
            variant="body2"
            color="text.secondary"
            sx={{ mb: 0.5, fontStyle: "italic" }}
          >
            “{r.comentario}”
          </Typography>
        ))}
      </CardContent>
    </Card>
  );
}

export default function TurneroPage() {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingState>(() => ({
    ...BOOKING_INICIAL,
    ...cargarClienteGuardado(),
  }));
  const [prefillApplicado] = useState(() => !!cargarClienteGuardado());

  const subtipos = useSubtipos(booking.vehiculoTipo);
  const servicios = useServicios(booking.vehiculoTipo, booking.subtipo);
  const disponibilidad = useDisponibilidad(
    booking.diaIso,
    booking.vehiculoTipo,
  );
  const empresas = useEmpresasPublicas();
  const reservar = useReservarTurno();

  const servicioElegido = useMemo(
    () => servicios.data?.find((s) => s.id === booking.servicioId),
    [servicios.data, booking.servicioId],
  );
  const diaElegido = useMemo(
    () => DIAS.find((d) => d.iso === booking.diaIso) ?? DIAS[0],
    [booking.diaIso],
  );

  // Al elegir el tipo de vehículo, se selecciona la primera pestaña de
  // subtipo por defecto (igual que la demo) en vez de dejar que el usuario
  // tenga que tocarla a mano.
  useEffect(() => {
    if (
      booking.vehiculoTipo &&
      !booking.subtipo &&
      subtipos.data &&
      subtipos.data.length > 0
    ) {
      setBooking((b) => ({ ...b, subtipo: subtipos.data![0] }));
    }
  }, [booking.vehiculoTipo, booking.subtipo, subtipos.data]);

  const pickVehiculo = (tipo: VehiculoTipo) => {
    setBooking((b) => ({
      ...b,
      vehiculoTipo: tipo,
      subtipo: undefined,
      servicioId: undefined,
    }));
  };

  const pickSubtipo = (subtipo: string) => {
    setBooking((b) => ({ ...b, subtipo, servicioId: undefined }));
  };

  const confirmar = () => {
    if (
      !booking.vehiculoTipo ||
      !booking.subtipo ||
      !booking.servicioId ||
      !booking.hora ||
      !booking.formaPago
    )
      return;
    guardarClienteGuardado({
      denominacion: booking.denominacion.trim(),
      telefono: booking.telefono.trim(),
      cuit: booking.cuit.trim(),
      marca: booking.marca.trim(),
      modelo: booking.modelo.trim(),
      patente: booking.patente.trim(),
      empresaId: booking.empresaId,
      formaPago: booking.formaPago,
    });
    reservar.mutate({
      vehiculoTipo: booking.vehiculoTipo,
      subtipo: booking.subtipo,
      servicioId: booking.servicioId,
      fecha: booking.diaIso,
      hora: booking.hora,
      denominacion: booking.denominacion.trim(),
      telefono: booking.telefono.trim(),
      cuit: booking.cuit.trim() || undefined,
      marca: booking.marca.trim() || undefined,
      modelo: booking.modelo.trim() || undefined,
      patente: booking.patente.trim(),
      empresaId: booking.empresaId || undefined,
      formaPago: booking.formaPago,
    });
  };

  const reiniciar = () => {
    reservar.reset();
    // Solo se resetea la selección del turno — los datos de cliente/vehículo
    // quedan cargados para reservar otro turno sin volver a tipearlos.
    setBooking((b) => ({
      ...b,
      vehiculoTipo: "CAMION",
      subtipo: undefined,
      servicioId: undefined,
      diaIso: DIAS[0].iso,
      hora: undefined,
    }));
    setStep(1);
  };

  const datosValidos =
    booking.denominacion.trim() &&
    booking.telefono.trim() &&
    booking.patente.trim() &&
    booking.formaPago;

  const codigoError = (reservar.error as AxiosError<{ code?: string }>)
    ?.response?.data?.code;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box component="header" sx={{ bgcolor: "primary.dark" }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ maxWidth: 640, mx: "auto", px: 2, py: 2 }}
        >
          <Logo variant="navbar" />
          <Typography variant="h6" fontWeight={800} color="primary.contrastText">
            Lavadero Bella Italia
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 640, mx: "auto", px: 2, py: 5 }}>
        <Stack direction="row" spacing={1} mb={3}>
          {[1, 2, 3, 4].map((n) => (
            <Box
              key={n}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                bgcolor: n <= step ? "primary.main" : "divider",
              }}
            />
          ))}
        </Stack>

        <Card>
          <CardContent sx={{ p: 3 }}>
            {step === 1 && (
              <>
                <Typography variant="caption" color="text.secondary">
                  Paso 1 de 4
                </Typography>
                <Typography variant="h5" fontWeight={800} mb={2}>
                  ¿Qué vehículo traés?
                </Typography>
                <Stack direction="row" spacing={2} mb={3}>
                  {(["CAMION", "AUTO"] as VehiculoTipo[]).map((tipo) => (
                    <Card
                      key={tipo}
                      onClick={() => pickVehiculo(tipo)}
                      sx={{
                        flex: 1,
                        cursor: "pointer",
                        textAlign: "center",
                        py: 2,
                        borderColor:
                          booking.vehiculoTipo === tipo
                            ? "primary.main"
                            : "divider",
                        borderWidth: booking.vehiculoTipo === tipo ? 2 : 1,
                        bgcolor:
                          booking.vehiculoTipo === tipo
                            ? "background.default"
                            : "background.paper",
                      }}
                    >
                      <Typography fontSize={32}>
                        {tipo === "CAMION" ? "🚛" : "🚗"}
                      </Typography>
                      <Typography fontWeight={700}>
                        {tipo === "CAMION" ? "Camión" : "Auto"}
                      </Typography>
                    </Card>
                  ))}
                </Stack>

                {booking.vehiculoTipo && (
                  <>
                    <Typography variant="overline" color="text.secondary">
                      Tipo de vehículo
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
                      {(subtipos.data ?? []).map((s) => (
                        <Chip
                          key={s}
                          label={s}
                          onClick={() => pickSubtipo(s)}
                          color={booking.subtipo === s ? "primary" : "default"}
                          variant={
                            booking.subtipo === s ? "filled" : "outlined"
                          }
                        />
                      ))}
                    </Stack>
                  </>
                )}

                {booking.vehiculoTipo && booking.subtipo && (
                  <>
                    <Typography variant="overline" color="text.secondary">
                      Tipo de servicio
                    </Typography>
                    <Stack spacing={1} mb={1}>
                      {(servicios.data ?? []).map((s: Servicio) => (
                        <Box
                          key={s.id}
                          onClick={() =>
                            setBooking((b) => ({ ...b, servicioId: s.id }))
                          }
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            p: 1.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor:
                              booking.servicioId === s.id
                                ? "primary.main"
                                : "divider",
                            bgcolor:
                              booking.servicioId === s.id
                                ? "background.default"
                                : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <Box>
                            <Typography fontWeight={700}>{s.nombre}</Typography>
                            {s.descripcion && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {s.descripcion}
                              </Typography>
                            )}
                          </Box>
                          <Typography fontFamily="monospace" fontWeight={700}>
                            {formatPesos(s.precio)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      mb={2}
                    >
                      Precios netos: no incluyen IVA.
                    </Typography>
                  </>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={!booking.servicioId}
                  onClick={() => setStep(2)}
                >
                  Elegir horario
                </Button>

                <ResenasStrip />
              </>
            )}

            {step === 2 && (
              <>
                <Typography variant="caption" color="text.secondary">
                  Paso 2 de 4
                </Typography>
                <Typography variant="h5" fontWeight={800} mb={2}>
                  Elegí el horario
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    overflowX: "auto",
                    pb: 1,
                    mb: 2,
                  }}
                >
                  {DIAS.map((d) => (
                    <Button
                      key={d.iso}
                      onClick={() =>
                        setBooking((b) => ({
                          ...b,
                          diaIso: d.iso,
                          hora: undefined,
                        }))
                      }
                      variant={
                        booking.diaIso === d.iso ? "contained" : "outlined"
                      }
                      sx={{
                        flexDirection: "column",
                        minWidth: 56,
                        flexShrink: 0,
                        py: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ textTransform: "none" }}
                      >
                        {d.isToday ? "Hoy" : DOW_SHORT[d.date.getDay()]}
                      </Typography>
                      <Typography fontWeight={700}>
                        {d.date.getDate()}
                      </Typography>
                    </Button>
                  ))}
                </Box>

                {disponibilidad.isLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={28} />
                  </Box>
                ) : !disponibilidad.data?.abierto ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    El lavadero no abre los {DOW_LONG[diaElegido.date.getDay()]}
                    s. Elegí otro día.
                  </Alert>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(90px, 1fr))",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    {disponibilidad.data.slots.map((s) => (
                      <Box
                        key={s.hora}
                        onClick={() =>
                          s.disponible &&
                          setBooking((b) => ({ ...b, hora: s.hora }))
                        }
                        sx={{
                          textAlign: "center",
                          py: 1.25,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor:
                            booking.hora === s.hora
                              ? "primary.main"
                              : "divider",
                          bgcolor:
                            booking.hora === s.hora
                              ? "primary.main"
                              : s.disponible
                                ? "background.paper"
                                : "background.default",
                          color:
                            booking.hora === s.hora
                              ? "primary.contrastText"
                              : s.disponible
                                ? "text.primary"
                                : "text.disabled",
                          cursor: s.disponible ? "pointer" : "not-allowed",
                        }}
                      >
                        <Typography fontWeight={700} fontSize={14}>
                          {s.hora}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {s.disponible ? "Disponible" : "Sin cupo"}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" onClick={() => setStep(1)}>
                    Atrás
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={!booking.hora}
                    onClick={() => setStep(3)}
                  >
                    Continuar
                  </Button>
                </Stack>
              </>
            )}

            {step === 3 && (
              <>
                <Typography variant="caption" color="text.secondary">
                  Paso 3 de 4
                </Typography>
                <Typography variant="h5" fontWeight={800} mb={2}>
                  Tus datos
                </Typography>

                {prefillApplicado && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Te reconocimos en este dispositivo — completamos tus datos
                    de la última vez. Revisalos y confirmá.
                  </Alert>
                )}

                <Typography variant="overline" color="text.secondary">
                  Datos del cliente
                </Typography>
                <Stack spacing={2} mb={2}>
                  <TextField
                    label="Denominación (nombre o razón social)"
                    value={booking.denominacion}
                    onChange={(e) =>
                      setBooking((b) => ({
                        ...b,
                        denominacion: e.target.value,
                      }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="CUIT / CUIL (opcional)"
                    value={booking.cuit}
                    onChange={(e) =>
                      setBooking((b) => ({ ...b, cuit: e.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Teléfono (WhatsApp)"
                    value={booking.telefono}
                    onChange={(e) =>
                      setBooking((b) => ({ ...b, telefono: e.target.value }))
                    }
                    fullWidth
                  />
                </Stack>

                <Typography variant="overline" color="text.secondary">
                  Datos del vehículo
                </Typography>
                <Stack spacing={2} mb={2}>
                  <TextField
                    label="Marca"
                    value={booking.marca}
                    onChange={(e) =>
                      setBooking((b) => ({ ...b, marca: e.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Modelo"
                    value={booking.modelo}
                    onChange={(e) =>
                      setBooking((b) => ({ ...b, modelo: e.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Patente"
                    value={booking.patente}
                    onChange={(e) =>
                      setBooking((b) => ({ ...b, patente: e.target.value }))
                    }
                    fullWidth
                  />
                  {booking.vehiculoTipo === "CAMION" && (
                    <TextField
                      select
                      label="Empresa asociada (opcional)"
                      value={booking.empresaId}
                      onChange={(e) =>
                        setBooking((b) => ({
                          ...b,
                          empresaId: e.target.value
                            ? Number(e.target.value)
                            : "",
                        }))
                      }
                      fullWidth
                    >
                      <MenuItem value="">Particular / no aplica</MenuItem>
                      {(empresas.data ?? []).map((e) => (
                        <MenuItem key={e.id} value={e.id}>
                          {e.denominacion}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </Stack>

                <Typography variant="overline" color="text.secondary">
                  Forma de pago
                </Typography>
                <TextField
                  select
                  label="¿Cómo vas a abonar?"
                  value={booking.formaPago}
                  onChange={(e) =>
                    setBooking((b) => ({
                      ...b,
                      formaPago: e.target.value as FormaPago,
                    }))
                  }
                  fullWidth
                  sx={{ mb: 3 }}
                >
                  {Object.entries(FORMA_PAGO_LABEL).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>

                {reservar.isError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {codigoError === "SLOT_OCUPADO"
                      ? "Ese horario ya no está disponible. Volvé a elegir otro."
                      : "No se pudo confirmar el turno. Probá de nuevo."}
                  </Alert>
                )}

                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" onClick={() => setStep(2)}>
                    Atrás
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={!datosValidos || reservar.isPending}
                    onClick={() => {
                      confirmar();
                      setStep(4);
                    }}
                  >
                    Confirmar turno
                  </Button>
                </Stack>
              </>
            )}

            {step === 4 && (
              <>
                {reservar.isPending ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : reservar.isError ? (
                  <>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {codigoError === "SLOT_OCUPADO"
                        ? "Ese horario ya no está disponible."
                        : "No se pudo confirmar el turno."}
                    </Alert>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => setStep(3)}
                    >
                      Volver a intentar
                    </Button>
                  </>
                ) : (
                  <>
                    <Box textAlign="center" mb={2}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
                      <Typography variant="h5" fontWeight={800} mt={1}>
                        Turno confirmado
                      </Typography>
                      <Typography color="text.secondary">
                        Te mandamos la confirmación por WhatsApp.
                      </Typography>
                    </Box>
                    <Card variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        {[
                          ["Cliente", booking.denominacion],
                          ...(booking.cuit
                            ? [["CUIT/CUIL", booking.cuit]]
                            : []),
                          ["Teléfono", booking.telefono],
                          [
                            "Vehículo",
                            `${booking.vehiculoTipo === "CAMION" ? "Camión" : "Auto"} · ${booking.subtipo} · ${booking.patente.toUpperCase()}`,
                          ],
                          ["Servicio", servicioElegido?.nombre ?? ""],
                          [
                            "Día y hora",
                            `${formatDiaLabel(diaElegido)} · ${booking.hora}`,
                          ],
                          [
                            "Forma de pago",
                            booking.formaPago
                              ? FORMA_PAGO_LABEL[booking.formaPago]
                              : "",
                          ],
                          [
                            "Total (neto, sin IVA)",
                            formatPesos(servicioElegido?.precio ?? 0),
                          ],
                        ].map(([k, v]) => (
                          <Stack
                            key={k}
                            direction="row"
                            justifyContent="space-between"
                            py={0.5}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {k}
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {v}
                            </Typography>
                          </Stack>
                        ))}
                      </CardContent>
                    </Card>
                    <Button variant="outlined" fullWidth onClick={reiniciar}>
                      Reservar otro turno
                    </Button>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
      <SiteFooter />
    </Box>
  );
}
