/*
  Warnings:

  - You are about to drop the column `marca` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `modelo` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `patente` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `subtipo` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `vehiculo` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `cliente_id` on the `turnos` table. All the data in the column will be lost.
  - You are about to drop the column `patente` on the `turnos` table. All the data in the column will be lost.
  - Added the required column `vehiculo_id` to the `turnos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "turnos" DROP CONSTRAINT "turnos_cliente_id_fkey";

-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "marca",
DROP COLUMN "modelo",
DROP COLUMN "patente",
DROP COLUMN "subtipo",
DROP COLUMN "vehiculo";

-- AlterTable
ALTER TABLE "turnos" DROP COLUMN "cliente_id",
DROP COLUMN "patente",
ADD COLUMN     "vehiculo_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "tipo" "VehiculoTipo" NOT NULL,
    "subtipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "patente" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
