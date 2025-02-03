import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User, UpdateUserResult } from '../types/user.type';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DatabaseService) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.dbService.createUser(
      createUserDto.username,
      createUserDto.email,
    );
  }

  async getUser(id: number): Promise<User | null> {
    return this.dbService.getUser(id);
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResult | null> {
    const { username, email } = updateUserDto;
    return this.dbService.updateUser(id, username, email);
  }

  async getUnsynced(): Promise<User[]> {
    return this.dbService.getUnsynced();
  }
}
