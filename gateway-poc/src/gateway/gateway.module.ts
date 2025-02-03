import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { ConsulModule } from '../consul/consul.module';

@Module({
  imports: [ConsulModule],
  controllers: [GatewayController],
})
export class GatewayModule {}
