import {
  All,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ConsulService } from '../consul/consul.service';
import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';

@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(
    private readonly consulService: ConsulService,
    private readonly configService: ConfigService,
  ) {}

  @All(':service/*')
  async proxy(@Param('service') service: string, @Req() req: Request) {
    this.logger.debug(
      `Incoming request for service: ${service}, path: ${req.path}`,
    );

    try {
      const serviceInstance = await this.consulService.getService(service);
      const targetPath = req.path.replace(new RegExp(`^/${service}`), '');
      const target = {
        hostname: serviceInstance.address,
        port: serviceInstance.port,
        path:
          targetPath +
          (req.url.includes('?')
            ? req.url.substring(req.url.indexOf('?'))
            : ''),
        method: req.method,
        headers: {
          ...req.headers,
          host: `${serviceInstance.address}:${serviceInstance.port}`,
        },
      };

      this.logger.debug(
        `Proxying request to: http://${target.hostname}:${target.port}${target.path}`,
      );

      return new Promise<void>((resolve, reject) => {
        if (!req.res) {
          const error = new HttpException(
            'Response object is missing',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
          this.logger.error(error.message);
          reject(error);
          return;
        }

        const proxyReq = http.request(target, (proxyRes: IncomingMessage) => {
          req.res!.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
          proxyRes.pipe(req.res as ServerResponse<IncomingMessage>);
          proxyRes.on('end', () => {
            this.logger.debug('Successfully proxied request');
            resolve();
          });
        });

        proxyReq.on('error', (err: Error) => {
          this.logger.error('Proxy error:', err.message, {
            service,
            target: `${target.hostname}:${target.port}`,
          });
          reject(
            new HttpException(
              'Service unavailable',
              HttpStatus.SERVICE_UNAVAILABLE,
            ),
          );
        });

        if (req.body) {
          proxyReq.write(req.body);
        }
        proxyReq.end();
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          this.logger.warn(`Service not found: ${service}`);
          throw new HttpException(
            `Service ${service} not found`,
            HttpStatus.NOT_FOUND,
          );
        }
        if (error.message.includes('No healthy instances')) {
          this.logger.warn(`No healthy instances for service: ${service}`);
          throw new HttpException(
            `No healthy instances of ${service} available`,
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }

      this.logger.error('Gateway error:', error);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
