import { registerAs } from '@nestjs/config';

export interface Config {
  port: number;
  consul: {
    host: string;
    port: number;
  };
  services: {
    users: {
      name: string;
    };
  };
  log: {
    level: string;
  };
}

export const appConfig = registerAs(
  'app',
  (): Config => ({
    port: parseInt(process.env.PORT || '3000', 10),
    consul: {
      host: process.env.CONSUL_HOST || 'localhost',
      port: parseInt(process.env.CONSUL_PORT || '8500', 10),
    },
    services: {
      users: {
        name: 'users-service',
      },
    },
    log: {
      level: process.env.LOG_LEVEL || 'info',
    },
  }),
);
