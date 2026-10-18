# Bella Italia — Sistema de gestión del lavadero

Monorepo (npm workspaces) con backend en Node/Express/TypeScript y frontend en React/TypeScript.

- `apps/backend` — API REST (Express + Prisma + PostgreSQL)
- `apps/frontend` — Panel admin + turnero (React + Vite + MUI)
- `demo.html` / `index.html` / `propuesta.html` — demo estática y propuesta comercial (no forman parte de esta app; `index.html` sigue siendo lo que sirve GitHub Pages)

## Requisitos

- Node.js >= 18
- Docker (para levantar Postgres local)

## Puesta en marcha (Etapa 1)

```bash
# 1. Levantar la base de datos
docker compose up -d

# 2. Instalar dependencias (raíz del monorepo, instala ambos workspaces)
npm install

# 3. Generar el cliente de Prisma
npm run db:generate --workspace=backend

# 4. Levantar backend + frontend juntos
npm run dev
```

- Backend: http://localhost:3002 (health: `/api/health`, `/api/health/db`)
- Frontend: http://localhost:5174

En esta etapa el frontend muestra una pantalla de verificación: confirma que React se renderiza, que llega al backend y que el backend llega a la base de datos. A partir de la Etapa 2 esa pantalla se reemplaza por el login real.

## Variables de entorno

Copiar `apps/backend/.env.example` a `apps/backend/.env` (ya está creado para desarrollo local). Ver también `.env.example` en la raíz como referencia general.

## Scripts útiles (desde la raíz)

- `npm run dev` — backend + frontend en paralelo
- `npm run build` — build de producción de ambos
- `npm run lint` / `npm run lint:fix`
- `npm run type-check`
- `npm run format` — Prettier sobre todo el repo
