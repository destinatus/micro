import { Injectable } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DatabaseService } from '../database/database.service';
import { CreateUserResult, UpdateUserResult } from '../types/user.type';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  @MessagePattern({ cmd: 'createUser' })
  async createUser(data: { username: string; email: string }): Promise<CreateUserResult> {
    return this.databaseService.createUser(data.username, data.email);
  }

  @MessagePattern({ cmd: 'updateUser' })
  async updateUser(data: { id: number; username?: string; email?: string }): Promise<UpdateUserResult> {
    return this.databaseService.updateUser(data.id, data.username, data.email);
  }

  @MessagePattern({ cmd: 'getUser' })
  async getUser(id: number): Promise<CreateUserResult | null> {
    return this.databaseService.getUser(id);
  }

  @MessagePattern({ cmd: 'getAllUsers' })
  async getAllUsers(): Promise<CreateUserResult[]> {
    return this.databaseService.getAllUsers();
  }

  @MessagePattern({ cmd: 'deleteUser' })
  async deleteUser(id: number): Promise<void> {
    return this.databaseService.deleteUser(id);
  }

  @MessagePattern({ cmd: 'getUnsynced' })
  async getUnsynced(): Promise<CreateUserResult[]> {
    return this.databaseService.getUnsynced();
  }

  @MessagePattern({ cmd: 'markSynced' })
  async markSynced(id: number): Promise<void> {
    return this.databaseService.markSynced(id);
  }
}
