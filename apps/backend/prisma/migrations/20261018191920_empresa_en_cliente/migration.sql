-- CreateEnum
CREATE TYPE "TipoFacturacion" AS ENUM ('ARCA', 'INTERNA');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "cuenta_corriente_habilitada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "descuento_pct" INTEGER,
ADD COLUMN     "es_empresa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "facturacion" "TipoFacturacion";
