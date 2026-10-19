/*
  Warnings:

  - Added the required column `precio_neto` to the `turnos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "turnos" ADD COLUMN     "precio_neto" INTEGER NOT NULL;
