import { Controller, Get, Post, Put, Delete, Param, Body, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy, Transport, ClientProxyFactory } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { User, UpdateUserResult } from '../types/user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { firstValueFrom } from 'rxjs';

@Controller('users')
export class UsersController implements OnModuleInit {
  private readonly clients: ClientProxy[] = [];

  constructor(
    private readonly dbService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    // Initialize clients for other service instances
    const totalInstances = 3; // Match with docker-compose replicas
    for (let i = 1; i <= totalInstances; i++) {
      if (i.toString() !== process.env.REPLICA_ID) {
        this.clients.push(
          ClientProxyFactory.create({
            transport: Transport.TCP,
            options: {
              host: `users-service-${i}`,
              port: 3001,
            },
          }),
        );
      }
    }
  }

  async onModuleInit() {
    // Connect to all clients
    await Promise.all(
      this.clients.map(client => client.connect()),
    );
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    const result = await this.dbService.createUser(
      createUserDto.username,
      createUserDto.email,
    );

    // Notify other instances
    await Promise.all(
      this.clients.map(client =>
        firstValueFrom(client.emit('user.created', result)),
      ),
    );

    return result;
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
    const result = await this.dbService.updateUser(Number(id), username, email);

    // Notify other instances
    await Promise.all(
      this.clients.map(client =>
        firstValueFrom(client.emit('user.updated', result)),
      ),
    );

    return result;
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.dbService.deleteUser(Number(id));

    // Notify other instances
    await Promise.all(
      this.clients.map(client =>
        firstValueFrom(client.emit('user.deleted', { id: Number(id) })),
      ),
    );
  }

  @Get()
  async getUnsynced(): Promise<User[]> {
    return this.dbService.getUnsynced();
  }

  @Post(':id/sync')
  async markSynced(@Param('id') id: string): Promise<void> {
    await this.dbService.markSynced(Number(id));

    // Notify other instances
    await Promise.all(
      this.clients.map(client =>
        firstValueFrom(client.emit('user.synced', { id: Number(id) })),
      ),
    );
  }
}
