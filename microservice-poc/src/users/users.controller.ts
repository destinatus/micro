import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User, UpdateUserResult } from '../types/user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly dbService: DatabaseService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.dbService.createUser(
      createUserDto.username,
      createUserDto.email,
    );
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<User | null> {
    return this.dbService.getUser(Number(id));
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResult | null> {
    const { username, email } = updateUserDto;
    return this.dbService.updateUser(Number(id), username, email);
  }

  @Get()
  async getUnsynced(): Promise<User[]> {
    return this.dbService.getUnsynced();
  }
}
