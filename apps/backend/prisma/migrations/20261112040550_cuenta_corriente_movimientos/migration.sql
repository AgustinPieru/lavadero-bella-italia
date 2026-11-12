-- CreateTable
CREATE TABLE "movimientos_cuenta_corriente" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" TEXT NOT NULL,
    "debe" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "haber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL,
    "factura_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_cuenta_corriente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimientos_cuenta_corriente_cliente_id_id_idx" ON "movimientos_cuenta_corriente"("cliente_id", "id");

-- AddForeignKey
ALTER TABLE "movimientos_cuenta_corriente" ADD CONSTRAINT "movimientos_cuenta_corriente_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta_corriente" ADD CONSTRAINT "movimientos_cuenta_corriente_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
