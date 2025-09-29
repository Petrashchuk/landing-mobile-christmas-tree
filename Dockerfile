# --------- Build Stage ---------
FROM node:20-alpine AS builder

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package.json та package-lock.json
COPY package*.json ./

# Встановлюємо всі залежності (dev + prod)
RUN npm install

# Копіюємо весь код проекту
COPY . .

# Використовуємо npm run build для збірки продакшн-бандлу
RUN npm run build

# --------- Production Stage ---------
FROM node:20-alpine AS production

WORKDIR /app

# Копіюємо лише production-залежності
COPY package*.json ./
RUN npm install --production

# Копіюємо зібраний бандл і публічні файли з build-stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Виставляємо порт
EXPOSE 3000

# Використовуємо npm run start:prod для запуску продакшн-сервера
CMD ["npm", "run", "start:prod"]
