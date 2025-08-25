FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage: serve static files via Nginx
FROM nginx:alpine
# Non-root listen port for Azure App Service
ENV WEBSITES_PORT=8080
# Copy our nginx config and site
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Drop any unneeded default files (optional hardening)
RUN rm -f /etc/nginx/conf.d/default.conf.default 2>/dev/null || true
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
