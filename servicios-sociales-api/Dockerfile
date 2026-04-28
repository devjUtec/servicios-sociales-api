# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# ============================================
# Stage 3: Development
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Install ALL deps (including devDependencies for ts compilation)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy prisma schema FIRST so generate uses the current schema
COPY prisma ./prisma
RUN npx prisma generate

# Then copy rest of source
COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:dev"]

# ============================================
# Stage 4: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --chown=nestjs:nodejs package.json ./

USER nestjs

EXPOSE 3000

CMD ["node", "dist/src/main"]
