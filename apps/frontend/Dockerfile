# Build context: raíz del monorepo. En Railway: Root Directory = raíz del
# repo, Dockerfile Path = apps/frontend/Dockerfile.
FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/frontend apps/frontend
COPY apps/backend/package.json apps/backend/package.json

RUN npm ci

# Vite incrusta las variables VITE_* en el bundle AL COMPILAR (no en
# runtime) — Railway pasa las variables configuradas en el servicio como
# build args automáticamente.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace=frontend

FROM node:20-slim

WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/apps/frontend/dist ./dist

EXPOSE 3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
