/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DatabaseService } from '../database/database.service';
import { CreateUserResult, UpdateUserResult } from '../types/user.type';
import {
  UserMessagePattern,
  CreateUserRequest,
  UpdateUserRequest,
  GetUserRequest,
  DeleteUserRequest,
  MarkSyncedRequest,
} from '../types/message-patterns.type';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  @MessagePattern(UserMessagePattern.CREATE)
  async createUser(data: CreateUserRequest): Promise<CreateUserResult> {
    const { username, email } = data;
    return this.databaseService.createUser(username, email);
  }

  @MessagePattern(UserMessagePattern.UPDATE)
  async updateUser(data: UpdateUserRequest): Promise<UpdateUserResult> {
    const { id, username, email } = data;
    return this.databaseService.updateUser(id, username, email);
  }

  @MessagePattern(UserMessagePattern.GET_ONE)
  async getUser(data: GetUserRequest): Promise<CreateUserResult | null> {
    const { id } = data;
    return this.databaseService.getUser(id);
  }

  @MessagePattern(UserMessagePattern.GET_ALL)
  async getAllUsers(): Promise<CreateUserResult[]> {
    return this.databaseService.getAllUsers();
  }

  @MessagePattern(UserMessagePattern.DELETE)
  async deleteUser(data: DeleteUserRequest): Promise<void> {
    const { id } = data;
    return this.databaseService.deleteUser(id);
  }

  @MessagePattern(UserMessagePattern.GET_UNSYNCED)
  async getUnsynced(): Promise<CreateUserResult[]> {
    return this.databaseService.getUnsynced();
  }

  @MessagePattern(UserMessagePattern.MARK_SYNCED)
  async markSynced(data: MarkSyncedRequest): Promise<void> {
    const { id } = data;
    return this.databaseService.markSynced(id);
  }
}
