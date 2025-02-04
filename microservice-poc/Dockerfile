FROM node:18-bullseye

# Install PostgreSQL
RUN apt-get update && apt-get install -y postgresql postgresql-contrib && apt-get clean

# Initialize PostgreSQL data directory
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "ALTER USER postgres WITH PASSWORD 'postgres';" && \
    createdb microservice_poc

# Switch back to root to continue with Node.js setup
USER root

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Copy init script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

# Start PostgreSQL and the application
CMD ["/usr/local/bin/docker-entrypoint.sh"]
