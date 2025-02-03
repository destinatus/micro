import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
