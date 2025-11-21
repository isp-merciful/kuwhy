FROM node:20-alpine AS base

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

WORKDIR /app
COPY prisma ./prisma
COPY backend ./backend

WORKDIR /app/backend
RUN npx prisma generate --schema ../prisma/schema.prisma

FROM base AS migrator
ENV NODE_ENV=production
WORKDIR /app/backend

FROM base AS backend
WORKDIR /app/backend
RUN npm prune --omit=dev
ENV NODE_ENV=production
EXPOSE 8000
CMD ["node", "index.js"]
