-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('SUELDOS', 'IMPUESTOS', 'SERVICIOS', 'INSUMOS', 'OTRO');

-- CreateTable
CREATE TABLE "gastos" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "monto" INTEGER NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gastos_fecha_idx" ON "gastos"("fecha");
