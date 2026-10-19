import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// No hay registro público (ver auth.routes.ts): el primer usuario ADMIN se
// crea acá. Las credenciales son solo para desarrollo local — cambiarlas
// (o cargar un usuario nuevo) antes de ir a producción.
async function seedAdmin() {
  const email = 'admin@bellaitalia.com';
  const password = 'admin123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Ya existe un usuario con email ${email}, no se crea de nuevo.`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name: 'Administrador', role: 'ADMIN' },
  });

  console.log(`Usuario admin creado: ${user.email} (id ${user.id})`);
  console.log(`Password de desarrollo: ${password}`);
}

// Mismos datos que veníamos usando en la demo (demo.html), para no arrancar
// de cero: los mismos servicios con sus subtipos y precios, y un par de
// clientes de ejemplo. Transporte Cordillera queda con DOS vehículos, para
// dejar probado desde el seed que un cliente puede tener más de uno.
async function seedServiciosYClientes() {
  const serviciosExistentes = await prisma.servicio.count();
  if (serviciosExistentes > 0) {
    console.log('Ya hay servicios cargados, no se vuelve a sembrar.');
    return;
  }

  await prisma.servicio.createMany({
    data: [
      { nombre: 'Lavado exterior', descripcion: 'Carrocería y cabina', vehiculo: 'CAMION', subtipo: 'Semirremolque', precio: 11000 },
      { nombre: 'Lavado exterior', descripcion: 'Carrocería y cabina', vehiculo: 'CAMION', subtipo: 'Balancín', precio: 9000 },
      { nombre: 'Lavado exterior', descripcion: 'Carrocería y cabina', vehiculo: 'CAMION', subtipo: 'Chasis', precio: 7000 },
      { nombre: 'Lavado completo', descripcion: 'Exterior + interior + chasis', vehiculo: 'CAMION', subtipo: 'Semirremolque', precio: 17000 },
      { nombre: 'Lavado completo', descripcion: 'Exterior + interior + chasis', vehiculo: 'CAMION', subtipo: 'Balancín', precio: 14500 },
      { nombre: 'Lavado completo', descripcion: 'Exterior + interior + chasis', vehiculo: 'CAMION', subtipo: 'Chasis', precio: 11500 },
      { nombre: 'Lavado de chasis (bajos)', descripcion: 'Bajos y tren rodante', vehiculo: 'CAMION', subtipo: 'Semirremolque', precio: 7500 },
      { nombre: 'Lavado de chasis (bajos)', descripcion: 'Bajos y tren rodante', vehiculo: 'CAMION', subtipo: 'Balancín', precio: 6500 },
      { nombre: 'Lavado de chasis (bajos)', descripcion: 'Bajos y tren rodante', vehiculo: 'CAMION', subtipo: 'Chasis', precio: 5000 },
      { nombre: 'Lavado exterior', descripcion: 'Carrocería y llantas', vehiculo: 'AUTO', subtipo: 'Auto', precio: 3500 },
      { nombre: 'Lavado exterior', descripcion: 'Carrocería y llantas', vehiculo: 'AUTO', subtipo: 'SUV', precio: 4200 },
      { nombre: 'Lavado exterior', descripcion: 'Carrocería y llantas', vehiculo: 'AUTO', subtipo: 'Pickup', precio: 4600 },
      { nombre: 'Lavado completo', descripcion: 'Exterior + interior', vehiculo: 'AUTO', subtipo: 'Auto', precio: 5800 },
      { nombre: 'Lavado completo', descripcion: 'Exterior + interior', vehiculo: 'AUTO', subtipo: 'SUV', precio: 6800 },
      { nombre: 'Lavado completo', descripcion: 'Exterior + interior', vehiculo: 'AUTO', subtipo: 'Pickup', precio: 7400 },
    ],
  });

  const marcelo = await prisma.cliente.create({
    data: {
      denominacion: 'Marcelo Ibáñez', telefono: '11 5555-1234', cuit: '20-28773311-4',
      email: 'marcelo.ibanez@gmail.com', direccion: 'Av. Rivadavia 4820, CABA',
      vehiculos: { create: [{ tipo: 'AUTO', subtipo: 'Pickup', marca: 'Volkswagen', modelo: 'Amarok', patente: 'OT 442 GH' }] },
    },
  });
  const julieta = await prisma.cliente.create({
    data: {
      denominacion: 'Julieta Márquez', telefono: '11 4444-7788', cuit: '27-30112233-5',
      email: 'julieta.marquez@hotmail.com', direccion: 'Calle 50 N°1230, La Plata',
      vehiculos: { create: [{ tipo: 'AUTO', subtipo: 'Auto', marca: 'Ford', modelo: 'Fiesta', patente: 'PQ 205 XA' }] },
    },
  });
  const cordillera = await prisma.cliente.create({
    data: {
      denominacion: 'Transporte Cordillera SRL', telefono: '11 4321-0098', cuit: '30-71234567-8',
      email: 'administracion@cordillera.com.ar', direccion: 'Parque Industrial, Lote 12, San Justo',
      esEmpresa: true, descuentoPct: 18, facturacion: 'ARCA', cuentaCorrienteHabilitada: true,
      vehiculos: {
        create: [
          { tipo: 'CAMION', subtipo: 'Semirremolque', marca: 'Scania', modelo: 'R450', patente: 'AF 204 KL' },
          { tipo: 'CAMION', subtipo: 'Balancín', marca: 'Mercedes-Benz', modelo: 'Atego', patente: 'AD 560 MN' },
        ],
      },
    },
  });
  const bianchi = await prisma.cliente.create({
    data: {
      denominacion: 'Fletes Bianchi', telefono: '11 2233-4455', cuit: '20-34567891-3',
      email: 'bianchi.fletes@gmail.com', direccion: 'Ruta 9 km 45, San Justo',
      esEmpresa: true, descuentoPct: 5, facturacion: 'INTERNA', cuentaCorrienteHabilitada: false,
      vehiculos: { create: [{ tipo: 'CAMION', subtipo: 'Chasis', marca: 'Iveco', modelo: 'Tector', patente: 'AB 733 PL' }] },
    },
  });

  console.log(`Servicios y clientes de ejemplo cargados (${[marcelo, julieta, cordillera, bianchi].length} clientes).`);
}

// Mismos defaults que la demo: lunes a viernes 08:00-17:00 con un corte al
// mediodía, sábado media jornada, domingo cerrado. El patrón de modos
// (camión/auto/libre) es solo un punto de partida razonable — el admin lo
// termina de ajustar a mano desde Horarios y Cupos.
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
function generateSlots(desde: string, hasta: string): string[] {
  const out: string[] = [];
  let t = timeToMinutes(desde);
  const end = timeToMinutes(hasta);
  while (t < end) {
    out.push(minutesToTime(t));
    t += 75;
  }
  return out;
}
function buildDefaultModos(desde: string, hasta: string, offset = 0): Record<string, string> {
  const pattern = ['CAMION', 'CAMION', 'LIBRE', 'CAMION', 'AUTO', 'LIBRE'];
  const modos: Record<string, string> = {};
  generateSlots(desde, hasta).forEach((h, i) => {
    modos[h] = pattern[(i + offset) % pattern.length];
  });
  return modos;
}

async function seedHorarios() {
  const existentes = await prisma.horarioDia.count();
  if (existentes > 0) {
    console.log('Ya hay horarios cargados, no se vuelve a sembrar.');
    return;
  }

  const diaHabil = (desde: string, hasta: string) => {
    const modos = buildDefaultModos(desde, hasta);
    modos['11:45'] = 'CERRADO'; // corte de mediodía
    return {
      abierto: true,
      desde,
      hasta,
      modos,
      lineaBHabilitada: false,
      lineaBDesde: desde,
      lineaBHasta: hasta,
      modosLineaB: buildDefaultModos(desde, hasta, 3),
    };
  };

  await prisma.horarioDia.createMany({
    data: [
      { diaSemana: 0, abierto: false, desde: '08:00', hasta: '13:00', modos: {}, lineaBDesde: '08:00', lineaBHasta: '13:00', modosLineaB: {} }, // domingo
      { diaSemana: 1, ...diaHabil('08:00', '17:00') },
      { diaSemana: 2, ...diaHabil('08:00', '17:00') },
      { diaSemana: 3, ...diaHabil('08:00', '17:00') },
      { diaSemana: 4, ...diaHabil('08:00', '17:00') },
      { diaSemana: 5, ...diaHabil('08:00', '17:00') },
      {
        diaSemana: 6,
        abierto: true,
        desde: '08:00',
        hasta: '12:00',
        modos: buildDefaultModos('08:00', '12:00'),
        lineaBHabilitada: false,
        lineaBDesde: '08:00',
        lineaBHasta: '12:00',
        modosLineaB: buildDefaultModos('08:00', '12:00', 3),
      },
    ],
  });

  console.log('Horarios de la semana cargados (7 días).');
}

async function main() {
  await seedAdmin();
  await seedServiciosYClientes();
  await seedHorarios();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
