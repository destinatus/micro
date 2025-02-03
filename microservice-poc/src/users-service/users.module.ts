import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersServiceController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersServiceController],
  providers: [UsersService],
})
export class UsersServiceModule {}
