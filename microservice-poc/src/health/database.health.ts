import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.db.getAllUsers();
      return this.getStatus(key, true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false, { message: errorMessage }),
      );
    }
  }
}
