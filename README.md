# Microservice Architecture with CDC

This project demonstrates a microservice architecture using NestJS with Change Data Capture (CDC) using Debezium.

## Architecture

- API Gateway: Routes requests to appropriate services
- Service Layer: Each service has its own PostgreSQL instance
- CDC Layer: Debezium monitors PostgreSQL changes and syncs to Oracle
- Service Discovery: Consul for service registration and discovery

## Components

1. Gateway POC
   - API Gateway
   - Consul Service Discovery

2. Microservice POC
   - User Service
   - PostgreSQL instances (one per service)

3. Debezium Setup
   - Zookeeper
   - Kafka
   - Debezium Connect

4. Oracle
   - Target database for CDC

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- PostgreSQL 14
- Oracle Database

### Starting Services

Start individual components:
```bash
# Start Gateway and Consul
npm run start:gateway

# Start User Service
npm run start:service

# Start Debezium Stack
npm run start:debezium

# Start Oracle
npm run start:oracle
```

Or start everything at once:
```bash
npm run start:all
```

Stop all services:
```bash
npm run stop:all
```

## Project Structure

```
.
├── gateway-poc/           # API Gateway and Consul
├── microservice-poc/      # Services with PostgreSQL
├── debezium/             # CDC configuration
└── oracle/               # Oracle database setup
```

## Service Startup Order

1. Gateway POC (starts together):
   - Consul
   - API Gateway

2. Oracle Database

3. Debezium Stack:
   - Zookeeper
   - Kafka
   - Debezium

4. Services:
   - User Service + PostgreSQL
   - Additional services + their PostgreSQL instances

## Development

Each service is containerized and can be developed independently. The API Gateway handles routing requests to the appropriate service using Consul for service discovery.

## Data Flow

1. Client request → API Gateway
2. Gateway routes to appropriate service
3. Service interacts with its dedicated PostgreSQL instance
4. Debezium monitors PostgreSQL changes
5. Changes are published to Kafka
6. Debezium consumes from Kafka and syncs to Oracle
