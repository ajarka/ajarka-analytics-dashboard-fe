# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
#RUN npm ci
RUN npm install --legacy-peer-deps --force

# Copy source files
COPY . .

# Build the application
ARG GITHUB_TOKEN
ENV VITE_GITHUB_TOKEN=${GITHUB_TOKEN}
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration if needed
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add script to replace environment variables at runtime
RUN apk add --no-cache bash
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["bash", "/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]


# Langsung ke Nginx
# Production stage
# FROM nginx:alpine

# # Copy built assets from local machine
# COPY dist /usr/share/nginx/html

# # Copy nginx configuration if needed
# # COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Add script to replace environment variables at runtime
# RUN apk add --no-cache bash
# COPY docker-entrypoint.sh /docker-entrypoint.sh
# RUN chmod +x /docker-entrypoint.sh

# ENTRYPOINT ["/docker-entrypoint.sh"]
# CMD ["nginx", "-g", "daemon off;"]

# How to build and run
# - Build project dengan docker file
# docker build --build-arg GITHUB_TOKEN=your_token_here -t ajarka-dashboard .
# docker run -d -p 80:80 -e GITHUB_TOKEN=your_token_here ajarka-dashboard
# - Build di local computer:
# VITE_GITHUB_TOKEN=your_token_here npm run build
# docker build -t ajarka-dashboard .
# docker run -d -p 80:80 ajarka-dashboard
