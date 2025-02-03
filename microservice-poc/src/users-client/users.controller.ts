import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { User, UpdateUserResult } from '../types/user.type';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Controller('users')
export class UsersClientController {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    const response = await firstValueFrom(
      this.usersClient.send<User>({ cmd: 'create_user' }, createUserDto),
    );
    return response;
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<User | null> {
    const response = await firstValueFrom(
      this.usersClient.send<User | null>({ cmd: 'get_user' }, Number(id)),
    );
    return response;
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResult | null> {
    const response = await firstValueFrom(
      this.usersClient.send<UpdateUserResult | null>(
        { cmd: 'update_user' },
        { id: Number(id), updateData: updateUserDto },
      ),
    );
    return response;
  }

  @Get()
  async getUnsynced(): Promise<User[]> {
    const response = await firstValueFrom(
      this.usersClient.send<User[]>({ cmd: 'get_unsynced' }, {}),
    );
    return response;
  }
}
