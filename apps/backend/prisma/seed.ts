import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// No hay registro público (ver auth.routes.ts): el primer usuario ADMIN se
// crea acá. Las credenciales son solo para desarrollo local — cambiarlas
// (o cargar un usuario nuevo) antes de ir a producción.
async function main() {
  const email = 'admin@bellaitalia.com';
  const password = 'admin123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Ya existe un usuario con email ${email}, no se crea de nuevo.`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  console.log(`Usuario admin creado: ${user.email} (id ${user.id})`);
  console.log(`Password de desarrollo: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
