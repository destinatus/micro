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
  }),
);
