# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npx nest build --config nest-cli.users.json

# Production stage
FROM node:20-alpine

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/config ./config

# Set NODE_ENV
ENV NODE_ENV=production

CMD ["node", "dist/users-service/main"]
