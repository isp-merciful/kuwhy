# backend/Dockerfile
FROM node:20-alpine AS base

# 1) ติดตั้ง deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

# 2) คัดลอก schema + source
WORKDIR /app
COPY prisma ./prisma
COPY backend ./backend

# 3) generate Prisma Client (ต้องมี devDeps/cli)
WORKDIR /app/backend
RUN npx prisma generate --schema ../prisma/schema.prisma

# ---------- stage สำหรับ migrate (เก็บ devDeps ไว้) ----------
FROM base AS migrator
# ไม่มี prune -> ยังมี prisma CLI ใช้ migrate ได้
ENV NODE_ENV=production
WORKDIR /app/backend
# คำสั่งจริงจะส่งมาจาก docker-compose (command:)

# ---------- stage สำหรับ backend runtime (trim devDeps) ----------
FROM base AS backend
WORKDIR /app/backend
RUN npm prune --omit=dev
ENV NODE_ENV=production
EXPOSE 8000
CMD ["node", "index.js"]
