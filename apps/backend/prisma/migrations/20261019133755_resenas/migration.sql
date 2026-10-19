-- CreateEnum
CREATE TYPE "EstadoResena" AS ENUM ('PENDIENTE', 'APROBADA', 'OCULTA');

-- AlterTable
ALTER TABLE "turnos" ADD COLUMN     "resena_token" TEXT;

-- CreateTable
CREATE TABLE "resenas" (
    "id" SERIAL NOT NULL,
    "turno_id" INTEGER NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "comentario" TEXT,
    "estado" "EstadoResena" NOT NULL DEFAULT 'PENDIENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resenas_turno_id_key" ON "resenas"("turno_id");

-- CreateIndex
CREATE UNIQUE INDEX "turnos_resena_token_key" ON "turnos"("resena_token");

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
