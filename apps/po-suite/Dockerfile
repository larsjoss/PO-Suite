# Dev-only image — für lokale Entwicklung ohne docker compose.
# Für den Production-Enterprise-Build: Dockerfile.production verwenden.
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
