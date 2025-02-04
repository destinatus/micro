# syntax=docker/dockerfile:1.4
# Build stage
FROM node:20.11.0-alpine3.19 AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies with cache mounting
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source code
COPY . .

# Build the application
RUN npx nest build --config nest-cli.users.json

# Production stage
FROM node:20.11.0-alpine3.19

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

WORKDIR /usr/src/app

# Copy package files and install production dependencies with cache mounting
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/config ./config

# Set NODE_ENV
ENV NODE_ENV=production

CMD ["node", "dist/users-service/main"]
