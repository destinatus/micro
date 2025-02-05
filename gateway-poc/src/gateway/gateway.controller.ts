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
import { ConsulService } from '../consul/consul.service';
import { firstValueFrom } from 'rxjs';

@Controller('template-service')
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(
    private readonly consulService: ConsulService,
    @Inject('TEMPLATE_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Get('users')
  async findAllUsers() {
    try {
      return await firstValueFrom(
        this.client.send({ cmd: 'findAllUsers' }, {})
      );
    } catch (error) {
      this.logger.error('Error finding all users:', error);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('users/:id')
  async findOneUser(@Param('id') id: string) {
    try {
      return await firstValueFrom(
        this.client.send({ cmd: 'findOneUser' }, id)
      );
    } catch (error) {
      this.logger.error('Error finding user:', error);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post('users')
  async createUser(@Body() createUserDto: any) {
    try {
      return await firstValueFrom(
        this.client.send({ cmd: 'createUser' }, createUserDto)
      );
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: any) {
    try {
      return await firstValueFrom(
        this.client.send(
          { cmd: 'updateUser' },
          { id, updateUserDto }
        )
      );
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    try {
      return await firstValueFrom(
        this.client.send({ cmd: 'deleteUser' }, id)
      );
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
