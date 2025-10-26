# ===== Stage 1: copy schema from backend =====
FROM node:20-alpine AS backend-schema
WORKDIR /src
# 🔹 copy เฉพาะ schema จาก backend
COPY backend/prisma/schema.prisma ./prisma/schema.prisma

# ===== Stage 2: build frontend =====
FROM node:20-alpine

WORKDIR /app

# 🔹 ติดตั้ง dependencies ของ frontend
COPY frontend/package*.json ./
RUN npm install

# 🔹 copy schema จาก stage แรก (ตำแหน่งเดียวกัน)
COPY --from=backend-schema /src/prisma/schema.prisma ./prisma/schema.prisma

# 🔹 copy code ทั้งหมดของ frontend
COPY frontend . .

# 🔹 generate Prisma client จาก schema ที่ copy มา
RUN npx prisma generate --schema=./prisma/schema.prisma

CMD ["npm", "run", "dev"]
