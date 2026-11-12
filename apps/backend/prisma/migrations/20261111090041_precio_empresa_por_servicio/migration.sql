-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "descuento_pct";

-- CreateTable
CREATE TABLE "precios_empresa" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precios_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "precios_empresa_cliente_id_servicio_id_key" ON "precios_empresa"("cliente_id", "servicio_id");

-- AddForeignKey
ALTER TABLE "precios_empresa" ADD CONSTRAINT "precios_empresa_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precios_empresa" ADD CONSTRAINT "precios_empresa_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

