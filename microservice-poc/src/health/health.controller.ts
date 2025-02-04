import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async check() {
    try {
      await this.db.getAllUsers();
      return {
        status: 'ok',
        details: {
          database: {
            status: 'up'
          }
        }
      };
    } catch (error) {
      return {
        status: 'error',
        details: {
          database: {
            status: 'down',
            error: error.message
          }
        }
      };
    }
  }
}
