FROM node:20-alpine AS base
WORKDIR /app/backend

# dependencies
COPY backend/package*.json ./
RUN npm ci

# copy schema (อยู่ที่ /app/prisma)
WORKDIR /app
COPY prisma ./prisma

# copy source
COPY backend ./backend

# generate prisma client ด้วย schema กลาง
WORKDIR /app/backend
RUN npx prisma generate --schema ../prisma/schema.prisma

# ลดขนาด image (optional)
RUN npm prune --omit=dev

EXPOSE 4000
CMD sh -c "npx prisma migrate deploy --schema ../prisma/schema.prisma && node index.js"
