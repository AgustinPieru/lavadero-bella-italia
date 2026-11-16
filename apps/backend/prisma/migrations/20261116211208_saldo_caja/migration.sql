-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('CUENTA', 'EFECTIVO');

-- AlterTable
ALTER TABLE "gastos" ADD COLUMN     "medio_pago" "MedioPago";

-- AlterTable
ALTER TABLE "movimientos_cuenta_corriente" ADD COLUMN     "medio_pago" "MedioPago";

-- CreateTable
CREATE TABLE "saldo_inicial_caja" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "cuenta" DOUBLE PRECISION NOT NULL,
    "efectivo" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saldo_inicial_caja_pkey" PRIMARY KEY ("id")
);
