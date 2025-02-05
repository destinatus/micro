import { registerAs } from '@nestjs/config';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface Config {
  port: number;
  consul: {
    host: string;
    port: number;
    discoveryHost: string;
    healthCheck: {
      timeout: string;
      interval: string;
      route: string;
    };
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

export const appConfig = registerAs('app', (): Config => {
  // Load YAML config
  const yamlConfig = yaml.load(
    fs.readFileSync(path.join(process.cwd(), 'config.yaml'), 'utf8')
  ) as Record<string, any>;

  return {
    port: parseInt(process.env.PORT || yamlConfig.service?.port?.toString() || '3000', 10),
    consul: {
      host: process.env.CONSUL_HOST || yamlConfig.consul?.host || 'localhost',
      port: parseInt(process.env.CONSUL_PORT || yamlConfig.consul?.port?.toString() || '8500', 10),
      discoveryHost: process.env.CONSUL_DISCOVERY_HOST || yamlConfig.consul?.discoveryHost || 'localhost',
      healthCheck: {
        timeout: yamlConfig.consul?.healthCheck?.timeout || '5s',
        interval: yamlConfig.consul?.healthCheck?.interval || '10s',
        route: yamlConfig.consul?.healthCheck?.route || '/health',
      },
    },
    services: {
      users: {
        name: process.env.USERS_SERVICE_NAME || 'template-service',
      },
    },
    log: {
      level: process.env.LOG_LEVEL || 'info',
    },
  };
});
