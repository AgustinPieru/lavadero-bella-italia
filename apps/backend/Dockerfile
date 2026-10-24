# Build context: raíz del monorepo (es un workspace npm, necesita el
# package.json/package-lock.json de la raíz para resolver dependencias).
# En Railway: Root Directory = raíz del repo, Dockerfile Path = apps/backend/Dockerfile.
FROM node:20-slim

# Chromium del sistema para whatsapp-web.js/Puppeteer — mucho más rápido y
# confiable en el build que dejar que Puppeteer baje el suyo.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# apps/frontend/package.json se copia solo para que "npm ci" (workspaces)
# pueda resolver el árbol completo — no se necesita el resto de esa app acá.
COPY package.json package-lock.json ./
COPY apps/backend apps/backend
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm ci

# El postinstall de @prisma/client corre "prisma generate" sin --schema
# desde la raíz del repo y no encuentra apps/backend/prisma/schema.prisma —
# termina generando un cliente vacío. Se regenera a mano con el schema real.
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

RUN npm run build --workspace=backend

WORKDIR /app/apps/backend

EXPOSE 3002

# migrate deploy aplica solo migraciones ya generadas (nunca genera ni
# interactúa) — seguro para correr en cada arranque, es idempotente.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
