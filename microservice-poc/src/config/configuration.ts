export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

 import { v4 as uuidv4 } from 'uuid';

export interface Config {
  gateway: {
    port: number;
  };
  users: {
    host: string;
  };
  server: {
    instanceId: string;
  };
  microservice: {
    host: string;
  };
  consul: {
    host: string;
    port: number;
    serviceName: string;
    serviceId: string;
  };
  database: {
    postgres: DatabaseConfig;
    oracle: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
  };
}

export default (): Config => ({
  gateway: {
    port: parseInt(process.env.GATEWAY_PORT || '3000', 10),
  },
  users: {
    host: process.env.USERS_SERVICE_HOST || 'localhost',
  },
  server: {
    instanceId: process.env.HOSTNAME ?? uuidv4(),
  },
  microservice: {
    host: process.env.HOSTNAME ?? 'localhost',
  },
  consul: {
    host: process.env.CONSUL_HOST || 'localhost',
    port: parseInt(process.env.CONSUL_PORT || '8500', 10),
    serviceName: 'microservice-poc',
    serviceId: `microservice-poc-${process.env.HOSTNAME ?? uuidv4()}`,
  },
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'microservice_poc',
    },
    oracle: {
      host: process.env.ORACLE_HOST || 'localhost',
      port: parseInt(process.env.ORACLE_PORT || '1521', 10),
      user: process.env.ORACLE_USER || 'system',
      password: process.env.ORACLE_PASSWORD || 'oracle',
      database: process.env.ORACLE_DB || 'XE',
    },
  },
});
