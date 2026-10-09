# Prompt de construcción — Sistema de Gestión Lavadero Bella Italia

> Este documento es la especificación funcional y técnica para construir el sistema.
> Está pensado para pasarse como instrucción inicial a un agente de desarrollo (Claude Code)
> cuando se decida arrancar la implementación real. No es la demo ni la propuesta comercial —
> es el "para qué construir" detallado.

## 1. Objetivo

Construir una aplicación web (admin + turnero público) para un lavadero de camiones y autos que hoy
gestiona todo en papel (planillas de control diario, órdenes de trabajo por duplicado, facturación manual).
El sistema debe reemplazar ese trabajo manual, dar visibilidad de contabilidad (ingresos, gastos, ganancia)
y permitir que los clientes (empresas de transporte y particulares) reserven turno online sin necesidad
de crear una cuenta.

El lavadero tiene **una sola línea de trabajo** (un lavado por turno) con posibilidad de habilitar una
**línea B** de contingencia cuando la línea A se satura.

## 2. Alcance por fases

**Fase 1 — Sistema completo**
- Turnero público (sin login) con selección de tipo de vehículo, servicio y horario disponible,
  con selector de día tipo carrusel (no solo "hoy/mañana/pasado": cualquier día dentro de la
  ventana de reservas habilitada).
- Panel admin: alta, edición y baja de servicios, tipos de vehículo, precios y horarios.
- Registro de clientes (particulares y de empresa): alta manual desde el panel, para cuando el
  contacto se da por mostrador o teléfono y no a través del turnero público.
- Gestión de turnos del día, línea A / línea B, incluyendo alta manual de turnos para clientes que
  llegan sin reserva previa, edición de turnos existentes y baja (cancelación). La agenda es
  navegable a fechas anteriores y posteriores (no solo el día actual), para consultar o cargar
  turnos de cualquier fecha.
- Órdenes de trabajo digitales (generación de PDF, registro por duplicado interno).
- Control diario automático (reemplaza la planilla en papel).
- Carga de gastos (sueldos, impuestos, servicios, insumos).
- Gestión de empresas cliente con tarifas diferenciales.
- Facturación consolidada diaria a empresas (1 a n camiones por comprobante).
- Facturación con flag fiscal: comprobante ARCA (integración real con AFIP/ARCA vía Web Service de
  Facturación Electrónica, requiere certificado digital y CUIT del cliente) vs. comprobante interno
  ("en negro", solo circuito interno del sistema, sin timbrado fiscal).
- Envío de órdenes de trabajo, control diario, facturas y reportes por WhatsApp (API de WhatsApp
  Business) y email. Además de PDF, órdenes de trabajo y reportes de contabilidad se pueden exportar
  a Google Drive o en formato CSV.
- Reseñas de clientes: al marcar un turno como "completado", el sistema le envía al cliente un link
  (WhatsApp/email) para calificar el lavado (estrellas 1 a 5 + comentario opcional). Las reseñas
  quedan pendientes de aprobación en el panel admin antes de mostrarse públicamente; una vez
  aprobadas, se muestran en el turnero público (promedio general + comentarios destacados) como
  prueba social para clientes nuevos que están por reservar.
- Reportes, con **filtro de período** (hoy / últimos 7 días / últimos 30 días / este mes / rango
  personalizado desde-hasta): cantidad de lavados por tipo de vehículo, turnos cancelados / tasa de
  cancelación, ganancia neta, gastos por categoría, ingresos desglosados por forma de pago,
  rentabilidad por período, ranking de empresas por facturación.
  **Pendiente de validar con el cliente**: el detalle exacto de qué datos tienen que tener los
  reportes de contabilidad y cómo se arman (categorías, agrupamientos, por período o por empresa) —
  lo que está listado arriba es el punto de partida de la demo, no una definición cerrada.

**Fase 2 — Mejoras a demanda**
- Registro liviano opcional para empresas frecuentes (autocompletado server-side, no solo por dispositivo).
- Reglas de asignación de cupos más finas (franjas reservadas por categoría de vehículo, configurables).
- Multi-sucursal, si el negocio escala.

## 3. Stack técnico

- **Frontend**: Next.js (React), mobile-first, una sola codebase sirviendo tanto el turnero público
  como el panel admin (rutas separadas, autenticación solo para admin/operador).
- **Backend**: Node.js (API REST o server actions de Next.js), autenticación de sesión para admin/operador.
- **Base de datos**: PostgreSQL.
- **Generación de PDF**: librería server-side (ej. Puppeteer o similar) para órdenes de trabajo y facturas.
- **Notificaciones**: integración con WhatsApp Business API y servicio de email (ej. Resend/SendGrid).
- **Hosting**: cualquier PaaS con soporte Node + Postgres (Railway, Render, Vercel + DB gestionada, etc.),
  a definir según presupuesto de infraestructura del cliente.
- **URL / dominio**: pendiente de definir con el cliente — si usa un dominio propio del lavadero ya
  existente o si hay que registrar uno nuevo para el sistema.

## 4. Roles de usuario

- **Admin**: acceso completo — configuración, contabilidad, reportes, gestión de empresas y usuarios.
- **Operador**: carga turnos, marca lavados como completados, genera órdenes de trabajo, carga gastos.
  No necesariamente ve reportes financieros completos (a definir con el cliente si hace falta este matiz).
- **Cliente (sin cuenta)**: accede al turnero público vía link. Se identifica por un token guardado en
  `localStorage`/cookie del navegador que persiste sus datos de contacto y vehículo entre visitas, sin
  necesidad de registro. Empresas con muchos turnos pueden tener además un link/token dedicado que
  precarga su tarifa diferencial.

## 5. Modelo de datos (entidades principales)

- **Empresa**: denominación/razón social, CUIT, dirección, teléfono, email de contacto, tarifas
  diferenciales por tipo de servicio, condición de facturación (ARCA / interna / mixta).
- **Cliente particular**: denominación (nombre y apellido o razón social), CUIT/CUIL (opcional),
  teléfono, email, dirección, datos de vehículo(s) habituales (persistido vía token de dispositivo,
  no requiere cuenta).
- **Vehículo**: marca, modelo, patente, tipo (camión / auto), empresa asociada (si aplica).
- **TipoServicio**: nombre, precio base, duración estimada, aplica a qué tipo(s) de vehículo.
- **Turno**: fecha/hora, línea (A/B), vehículo, tipo de servicio, forma de pago (contado / transferencia /
  efectivo / cuenta corriente), estado (reservado/en curso/completado/cancelado), empresa o cliente
  particular asociado.
- **OrdenDeTrabajo**: turno asociado, detalle del servicio, firma/registro de entrega, PDF generado,
  canal de envío (WhatsApp/email) y estado de envío.
- **Factura**: empresa (o "consumidor final"), turnos incluidos (1 a n), tipo de comprobante
  (ARCA/interno), forma de pago, monto, fecha, estado de envío.
- **Gasto**: categoría (sueldo/impuesto/servicio/insumo/otro), monto, fecha, descripción.
- **ConfiguracionHorarios**: por cada día de la semana, de forma independiente: si el lavadero atiende
  ese día (abierto/cerrado) y su franja horaria propia de línea A (desde/hasta — ej. lunes 08:00 a
  17:00, sábado 08:00 a 12:00) con el cupo de cada media hora dentro de esa franja. El cupo de cada
  media hora tiene 4 estados posibles: **camión** (solo camión), **auto** (solo auto), **libre**
  (cualquiera) o **cerrado** (no se ofrece a nadie — ej. un corte de mediodía puntual, sin tener que
  recortar el desde/hasta general del día). Si la línea B está habilitada ese día, tiene su **propia
  franja horaria y su propio cupo por media hora** (mismos 4 estados), configurados de forma
  completamente independiente de la línea A. Todo configurable desde el admin.
- **Reseña**: turno asociado, cliente (denominación), puntaje (1 a 5 estrellas), comentario opcional,
  fecha, estado (pendiente / aprobada / oculta).
- **Usuario**: admin/operador, credenciales, rol.

## 6. Reglas de negocio específicas

- Un turno de auto **no debe ocupar un cupo reservado para camión** en las franjas donde el admin haya
  configurado prioridad para camiones. El sistema debe permitir marcar franjas horarias como
  "solo camión", "solo auto" o "libre", configurable desde el admin.
- La línea de trabajo B es una contingencia que el lavadero habilita o deshabilita manualmente, **por
  día de la semana**, no con un interruptor único para todo el negocio. Al habilitarla, el admin define
  su propia franja horaria y sus propios cupos por vehículo (misma mecánica que la línea A, pero
  independiente — puede tener menos horas, otro rango, u otra distribución de cupos). El horario que
  ve el cliente es la **unión** de lo que ofrecen la línea A y la línea B ese día: un horario está
  disponible si al menos una de las dos líneas lo tiene libre para su tipo de vehículo.
- Para el cliente que reserva, a qué línea queda asignado su turno es **siempre transparente**: el
  turnero público nunca menciona "línea A/B" en ningún punto (listado de horarios, confirmación,
  comprobante). La distinción de línea solo es visible puertas adentro, en el panel del lavadero.
- Los horarios de atención y la cantidad de turnos por día son variables y 100% configurables desde
  el admin (no hardcodeados).
- Los precios de los servicios son configurables desde el admin, con posibilidad de tarifa diferencial
  por empresa (override del precio base).
- **Confidencialidad de tarifas entre empresas**: la tarifa diferencial de una empresa es información
  privada de esa empresa — ninguna otra empresa ni cliente particular puede ver, inferir o acceder a los
  precios/descuentos negociados con otras empresas. Esto aplica en particular al link/token dedicado de
  empresa (ver sección 4): ese link solo puede precargar y mostrar la tarifa de **la empresa dueña del
  link**, nunca la de otra. El panel admin sí ve todas las tarifas (es información interna del lavadero),
  pero ninguna superficie de cara al cliente —turnero público, confirmaciones, comprobantes, reseñas—
  puede exponer precios o condiciones comerciales de una empresa a otra.
- Toda orden de trabajo se genera "por duplicado" en el sentido de que el sistema guarda una copia
  interna y genera un PDF entregable al cliente (reemplazando el papel carbónico).
- El control diario se arma automáticamente a partir de los turnos completados del día, sin carga manual.
- La forma de pago "cuenta corriente" solo está disponible para empresas habilitadas con esa condición;
  acumula saldo pendiente contra la empresa en lugar de registrarse como cobro inmediato (a diferencia de
  contado, transferencia y efectivo).
- El link para dejar una reseña solo se genera y se envía cuando un turno pasa a estado "completado"
  (nunca antes, y no hay un formulario abierto en el sitio) — así la reseña queda asociada a un turno
  real y no a cualquier visitante. Ninguna reseña se publica automáticamente: quedan pendientes de
  aprobación del lavadero antes de ser visibles en el turnero público, para poder filtrar antes de que
  algo quede expuesto sin revisar.

## 7. No funcionales

- Debe funcionar bien en dispositivos móviles (el turnero lo va a usar gente desde el celular).
- Interfaz simple e intuitiva, tanto para el operador del lavadero (usuario no necesariamente técnico)
  como para el cliente final que pide el turno.
- Localización: es-AR, zona horaria Argentina.
- Los envíos de documentos (órdenes de trabajo, facturas) deben poder hacerse por WhatsApp o email desde
  la misma pantalla, sin pasos manuales adicionales (descargar y adjuntar).
