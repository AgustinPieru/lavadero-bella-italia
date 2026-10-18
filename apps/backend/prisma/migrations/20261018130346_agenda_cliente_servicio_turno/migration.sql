-- CreateEnum
CREATE TYPE "VehiculoTipo" AS ENUM ('CAMION', 'AUTO');

-- CreateEnum
CREATE TYPE "Linea" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('RESERVADO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('CONTADO', 'TRANSFERENCIA', 'EFECTIVO', 'CUENTA_CORRIENTE');

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "denominacion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "cuit" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "vehiculo" "VehiculoTipo" NOT NULL,
    "subtipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "patente" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "vehiculo" "VehiculoTipo" NOT NULL,
    "subtipo" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "hora" TEXT NOT NULL,
    "linea" "Linea" NOT NULL DEFAULT 'A',
    "cliente_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "patente" TEXT NOT NULL,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'RESERVADO',
    "forma_pago" "FormaPago" NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "facturar" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "turnos_fecha_idx" ON "turnos"("fecha");

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
