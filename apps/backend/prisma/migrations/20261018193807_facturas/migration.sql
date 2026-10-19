-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('PENDIENTE', 'PAGADA');

-- AlterTable
ALTER TABLE "turnos" ADD COLUMN     "factura_id" INTEGER;

-- CreateTable
CREATE TABLE "facturas" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "comprobante" "TipoFacturacion" NOT NULL,
    "neto" INTEGER NOT NULL,
    "iva" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "forma_pago" "FormaPago" NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'PAGADA',
    "cae" TEXT,
    "cae_fch_vto" TIMESTAMP(3),
    "punto_venta" INTEGER,
    "numero_arca" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numero_key" ON "facturas"("numero");

-- CreateIndex
CREATE INDEX "facturas_fecha_idx" ON "facturas"("fecha");

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
