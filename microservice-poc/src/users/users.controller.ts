import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CreateUserResult, UpdateUserResult } from '../types/user.type';
import { UsersService } from '../users-service/users.service';
import {
  UserMessagePattern,
  CreateUserRequest,
  UpdateUserRequest,
  GetUserRequest,
  DeleteUserRequest,
  MarkSyncedRequest,
} from '../types/message-patterns.type';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(UserMessagePattern.CREATE)
  async createUser(data: CreateUserRequest): Promise<CreateUserResult> {
    const { username, email } = data;
    return this.usersService.createUser(username, email);
  }

  @MessagePattern(UserMessagePattern.GET_ONE)
  async getUser(data: GetUserRequest): Promise<CreateUserResult | null> {
    const { id } = data;
    return this.usersService.getUser(id);
  }

  @MessagePattern(UserMessagePattern.GET_ALL)
  async getAllUsers(): Promise<CreateUserResult[]> {
    return this.usersService.getAllUsers();
  }

  @MessagePattern(UserMessagePattern.UPDATE)
  async updateUser(data: UpdateUserRequest): Promise<UpdateUserResult | null> {
    const { id, username, email } = data;
    return this.usersService.updateUser(id, username, email);
  }

  @MessagePattern(UserMessagePattern.DELETE)
  async deleteUser(data: DeleteUserRequest): Promise<void> {
    const { id } = data;
    await this.usersService.deleteUser(id);
  }

  @MessagePattern(UserMessagePattern.GET_UNSYNCED)
  async getUnsynced(): Promise<CreateUserResult[]> {
    return this.usersService.getUnsynced();
  }

  @MessagePattern(UserMessagePattern.MARK_SYNCED)
  async markSynced(data: MarkSyncedRequest): Promise<void> {
    const { id } = data;
    await this.usersService.markSynced(id);
  }
}
