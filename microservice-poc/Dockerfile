FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install curl and netcat for healthcheck and wait-for-it script
RUN apk --no-cache add curl netcat-openbsd

# Copy and make wait-for-it script executable
COPY wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Expose port
EXPOSE 3000

# Start the application with wait-for-it
CMD ["/bin/sh", "-c", "/usr/local/bin/wait-for-it.sh postgres:5432 -- npm run start:prod"]
