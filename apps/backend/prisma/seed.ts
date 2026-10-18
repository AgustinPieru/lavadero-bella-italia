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
      vehiculos: { create: [{ tipo: 'CAMION', subtipo: 'Chasis', marca: 'Iveco', modelo: 'Tector', patente: 'AB 733 PL' }] },
    },
  });

  console.log(`Servicios y clientes de ejemplo cargados (${[marcelo, julieta, cordillera, bianchi].length} clientes).`);
}

async function main() {
  await seedAdmin();
  await seedServiciosYClientes();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
