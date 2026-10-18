-- CreateEnum
CREATE TYPE "ModoSlot" AS ENUM ('CAMION', 'AUTO', 'LIBRE', 'CERRADO');

-- CreateTable
CREATE TABLE "horarios_dia" (
    "id" SERIAL NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "abierto" BOOLEAN NOT NULL DEFAULT true,
    "desde" TEXT NOT NULL,
    "hasta" TEXT NOT NULL,
    "modos" JSONB NOT NULL,
    "linea_b_habilitada" BOOLEAN NOT NULL DEFAULT false,
    "linea_b_desde" TEXT,
    "linea_b_hasta" TEXT,
    "modos_linea_b" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_dia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "horarios_dia_dia_semana_key" ON "horarios_dia"("dia_semana");
