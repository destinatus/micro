import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserResult, UpdateUserResult } from '../types/user.type';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(username: string, email: string): Promise<CreateUserResult> {
    return this.databaseService.createUser(username, email);
  }

  async updateUser(id: number, username?: string, email?: string): Promise<UpdateUserResult> {
    return this.databaseService.updateUser(id, username, email);
  }

  async getUser(id: number): Promise<CreateUserResult | null> {
    return this.databaseService.getUser(id);
  }

  async getAllUsers(): Promise<CreateUserResult[]> {
    return this.databaseService.getAllUsers();
  }

  async deleteUser(id: number): Promise<void> {
    return this.databaseService.deleteUser(id);
  }

  async getUnsynced(): Promise<CreateUserResult[]> {
    return this.databaseService.getUnsynced();
  }

  async markSynced(id: number): Promise<void> {
    return this.databaseService.markSynced(id);
  }
}
