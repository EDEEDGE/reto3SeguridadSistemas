-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id" SERIAL NOT NULL,
    "correo" TEXT NOT NULL,
    "claveHash" TEXT,
    "nombre" TEXT,
    "proveedor" TEXT NOT NULL,
    "microsoftID" TEXT,
    "tiene2FA" BOOLEAN NOT NULL DEFAULT false,
    "secreto2FA" TEXT,
    "creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "public"."Usuario"("correo");
