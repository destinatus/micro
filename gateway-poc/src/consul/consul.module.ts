import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsulService } from './consul.service';

@Module({
  imports: [ConfigModule],
  providers: [ConsulService],
  exports: [ConsulService],
})
export class ConsulModule {}
