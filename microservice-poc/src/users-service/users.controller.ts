import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { User, UpdateUserResult } from '../types/user.type';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersServiceController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'create_user' })
  async createUser(data: CreateUserDto): Promise<User> {
    return this.usersService.createUser(data);
  }

  @MessagePattern({ cmd: 'get_user' })
  async getUser(id: number): Promise<User | null> {
    return this.usersService.getUser(id);
  }

  @MessagePattern({ cmd: 'update_user' })
  async updateUser(data: {
    id: number;
    updateData: UpdateUserDto;
  }): Promise<UpdateUserResult | null> {
    const { id, updateData } = data;
    return this.usersService.updateUser(id, updateData);
  }

  @MessagePattern({ cmd: 'get_unsynced' })
  async getUnsynced(): Promise<User[]> {
    return this.usersService.getUnsynced();
  }
}
