# frontend/Dockerfile

FROM node:20-alpine AS deps
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY prisma ./prisma
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend ./frontend

WORKDIR /app/frontend
ENV SKIP_BUILD_STATIC_GENERATION=true
RUN npx prisma generate --schema ../prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/frontend
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY --from=builder /app/frontend/package*.json ./
COPY frontend/public ./public
EXPOSE 3000
CMD ["npm", "start"]
