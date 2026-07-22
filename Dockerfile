# ==========================================
# Stage 1: Build the React static assets
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install package dependencies
RUN npm install

# Copy all application source code
COPY . .

# Accept build-time environment variables for Vite
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Compile assets for production (outputs to /app/dist)
RUN npm run build

# ==========================================
# Stage 2: Serve compiled assets with Nginx
# ==========================================
FROM nginx:alpine

# Copy custom Nginx configuration file to override default config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled frontend assets from builder stage to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
