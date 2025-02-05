import { Controller, NotFoundException } from '@nestjs/common';
import { MessagePattern, EventPattern } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, User } from './interfaces/user.interface';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'findAllUsers' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @MessagePattern({ cmd: 'findOneUser' })
  async findOne(id: string): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @MessagePattern({ cmd: 'createUser' })
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.usersService.create(createUserDto);
    // Emit an event after user creation
    this.emitUserCreated(user);
    return user;
  }

  @MessagePattern({ cmd: 'updateUser' })
  async update(data: { id: string; updateUserDto: UpdateUserDto }): Promise<User> {
    const { id, updateUserDto } = data;
    const user = await this.usersService.update(id, updateUserDto);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @MessagePattern({ cmd: 'deleteUser' })
  async remove(id: string): Promise<void> {
    const deleted = await this.usersService.remove(id);
    if (!deleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  @EventPattern('user.created')
  async emitUserCreated(user: User) {
    // Handle user created event
    console.log('User created event:', user);
  }

  @MessagePattern({ cmd: 'ping' })
  ping() {
    return { status: 'ok' };
  }
}
