import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConsulService } from '../consul/consul.service';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('template-service')
export class GatewayController implements OnModuleInit {
  
  private readonly logger = new Logger(GatewayController.name);
  private isConnected = false;
  private readonly maxRetries = 3;

  constructor(
    private readonly consulService: ConsulService,
    @Inject('TEMPLATE_SERVICE') private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      await this.client.connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to template service');
    } catch (error) {
      this.logger.error('Failed to initialize connection:', error);
      this.isConnected = false;
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (!this.isConnected) {
          await this.initializeConnection();
        }
        return await operation();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt} failed:`, error?.message || error);
        
        if (error?.message === 'Connection closed') {
          this.isConnected = false;
          // Try to get a new service instance
          try {
            const service = await this.consulService.getService('template-service', true);
            await this.client.close();
            // The client will reconnect on next operation
            this.logger.log(`Switching to new service instance: ${service.address}:${service.port}`);
          } catch (consulError) {
            this.logger.error('Failed to get new service instance:', consulError);
          }
        }

        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users', description: 'Retrieve a list of all users' })
  @ApiResponse({ status: 200, description: 'List of users retrieved successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async findAllUsers() {
    try {
      return await this.executeWithRetry(async () => {
        const response = this.client.send({ cmd: 'findAllUsers' }, {});
        return await firstValueFrom(response);
      });
    } catch (error) {
      this.logger.error('Error finding all users:', error?.message || error);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID', description: 'Retrieve a user by their ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async findOneUser(@Param('id') id: string) {
    try {
      return await this.executeWithRetry(async () => {
        const response = this.client.send({ cmd: 'findOneUser' }, id);
        return await firstValueFrom(response);
      });
    } catch (error) {
      this.logger.error('Error finding user:', error?.message || error);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('users')
  @ApiOperation({ summary: 'Create user', description: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.executeWithRetry(async () => {
        const response = this.client.send({ cmd: 'createUser' }, createUserDto);
        return await firstValueFrom(response);
      });
    } catch (error) {
      this.logger.error('Error creating user:', error?.message || error);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user', description: 'Update an existing user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      return await this.executeWithRetry(async () => {
        const response = this.client.send(
          { cmd: 'updateUser' },
          { id, updateUserDto }
        );
        return await firstValueFrom(response);
      });
    } catch (error) {
      this.logger.error('Error updating user:', error?.message || error);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user', description: 'Delete a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async deleteUser(@Param('id') id: string) {
    try {
      return await this.executeWithRetry(async () => {
        const response = this.client.send({ cmd: 'deleteUser' }, id);
        return await firstValueFrom(response);
      });
    } catch (error) {
      this.logger.error('Error deleting user:', error?.message || error);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
