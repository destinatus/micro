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
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConnectionHandlerService } from './connection-handler.service';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('template-service')
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(
    @Inject('TEMPLATE_SERVICE') private readonly client: ClientProxy,
    @Inject('TEMPLATE_SERVICE_HANDLER') private readonly connectionHandler: ConnectionHandlerService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users', description: 'Retrieve a list of all users' })
  @ApiResponse({ status: 200, description: 'List of users retrieved successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async findAllUsers() {
    try {
      return await this.connectionHandler.executeWithRetry(async () => {
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
      return await this.connectionHandler.executeWithRetry(async () => {
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
      return await this.connectionHandler.executeWithRetry(async () => {
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
      return await this.connectionHandler.executeWithRetry(async () => {
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
      return await this.connectionHandler.executeWithRetry(async () => {
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
