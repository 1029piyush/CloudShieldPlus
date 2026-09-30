# ==========================================
# Stage 1: Build the React static assets
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# ==========================================
# Stage 2: Serve with Nginx
# ==========================================
FROM nginx:alpine

# Install envsubst (comes with gettext, already in nginx:alpine)
RUN apk add --no-cache gettext

# Copy nginx config template
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Startup script: substitutes BACKEND_URL env var into nginx config, then starts nginx
# Falls back to http://backend:5000 if BACKEND_URL is not set (local docker-compose)
COPY docker-entrypoint-frontend.sh /docker-entrypoint-frontend.sh
RUN chmod +x /docker-entrypoint-frontend.sh

EXPOSE 80

CMD ["/docker-entrypoint-frontend.sh"]