# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM alpine:3.19

WORKDIR /app
COPY --from=builder /app/dist /app/dist

CMD ["sh", "-c", "mkdir -p /dist && cp -r /app/dist/. /dist"]
