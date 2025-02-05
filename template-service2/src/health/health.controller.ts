import { Controller, Get } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import {
  HealthCheck,
  HealthCheckService,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private microservice: MicroserviceHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const port = this.configService.get<number>('app.port');
    return this.health.check([
      () =>
        this.microservice.pingCheck('tcp', {
          transport: Transport.TCP,
          options: { host: 'localhost', port },
        }),
    ]);
  }

  @Get('liveness')
  @HealthCheck()
  liveness() {
    const port = this.configService.get<number>('app.port');
    return this.health.check([
      () =>
        this.microservice.pingCheck('tcp', {
          transport: Transport.TCP,
          options: { host: 'localhost', port },
        }),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    const port = this.configService.get<number>('app.port');
    return this.health.check([
      () =>
        this.microservice.pingCheck('tcp', {
          transport: Transport.TCP,
          options: { host: 'localhost', port },
        }),
    ]);
  }
}
