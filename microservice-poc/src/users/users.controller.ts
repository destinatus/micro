import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DatabaseService } from '../database/database.service';
import { User, UpdateUserResult } from '../types/user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UsersController {
  constructor(private readonly dbService: DatabaseService) {}

  @MessagePattern({ cmd: 'createUser' })
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.dbService.createUser(
      createUserDto.username,
      createUserDto.email,
    );
  }

  @MessagePattern({ cmd: 'getUser' })
  async getUser(id: number): Promise<User | null> {
    return this.dbService.getUser(id);
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
    return this.dbService.updateUser(id, username, email);
  }

  @MessagePattern({ cmd: 'deleteUser' })
  async deleteUser(id: number): Promise<void> {
    await this.dbService.deleteUser(id);
  }

  @MessagePattern({ cmd: 'getUnsynced' })
  async getUnsynced(): Promise<User[]> {
    return this.dbService.getUnsynced();
  }

  @MessagePattern({ cmd: 'markSynced' })
  async markSynced(id: number): Promise<void> {
    await this.dbService.markSynced(id);
  }
}
