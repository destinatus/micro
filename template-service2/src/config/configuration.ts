import { registerAs } from '@nestjs/config';

export interface Config {
  port: number;
  consul: {
    host: string;
    port: number;
  };
  service: {
    name: string;
  };
  log: {
    level: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    poolSize: number;
  };
}

export const appConfig = registerAs(
  'app',
  (): Config => ({
    port: parseInt(process.env.PORT || '3001', 10),
    consul: {
      host: process.env.CONSUL_HOST || 'localhost',
      port: parseInt(process.env.CONSUL_PORT || '8500', 10),
    },
    service: {
      name: 'template-service',
    },
    log: {
      level: process.env.LOG_LEVEL || 'info',
    },
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres_user',
      password: process.env.DB_PASSWORD || 'postgres_password',
      database: process.env.DB_NAME || 'template_db',
      poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
    },
  }),
);
