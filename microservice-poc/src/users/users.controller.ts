import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { User, UpdateUserResult } from '../types/user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from '../users-service/users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'createUser' })
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(
      createUserDto.username,
      createUserDto.email,
    );
  }

  @MessagePattern({ cmd: 'getUser' })
  async getUser(id: number): Promise<User | null> {
    return this.usersService.getUser(id);
  }

  @MessagePattern({ cmd: 'getAllUsers' })
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }

  @MessagePattern({ cmd: 'updateUser' })
  async updateUser(data: {
    id: number;
    updateUserDto: UpdateUserDto;
  }): Promise<UpdateUserResult | null> {
    const {
      id,
      updateUserDto: { username, email },
    } = data;
    return this.usersService.updateUser(id, username, email);
  }

  @MessagePattern({ cmd: 'deleteUser' })
  async deleteUser(id: number): Promise<void> {
    await this.usersService.deleteUser(id);
  }

  @MessagePattern({ cmd: 'getUnsynced' })
  async getUnsynced(): Promise<User[]> {
    return this.usersService.getUnsynced();
  }

  @MessagePattern({ cmd: 'markSynced' })
  async markSynced(id: number): Promise<void> {
    await this.usersService.markSynced(id);
  }
}
