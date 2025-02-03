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

# Install required packages
RUN apk --no-cache add curl netcat-openbsd dos2unix

# Ensure wait-for-it.sh has proper line endings and permissions
RUN dos2unix wait-for-it.sh && \
    chmod +x wait-for-it.sh && \
    mv wait-for-it.sh /usr/local/bin/

# Expose port
EXPOSE 3000

# Start the application with wait-for-it
CMD ["/bin/sh", "-c", "/usr/local/bin/wait-for-it.sh postgres:5432 -- npm run start:prod"]
