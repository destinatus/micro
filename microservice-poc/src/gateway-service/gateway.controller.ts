import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Controller('api')
export class GatewayController {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  @Get('users')
  getAllUsers(): Observable<any> {
    return this.usersClient.send({ cmd: 'getAllUsers' }, {});
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string): Observable<any> {
    return this.usersClient.send({ cmd: 'getUserById' }, { id });
  }

  @Post('users')
  createUser(@Body() createUserDto: any): Observable<any> {
    return this.usersClient.send({ cmd: 'createUser' }, createUserDto);
  }

  @Put('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: any,
  ): Observable<any> {
    return this.usersClient.send(
      { cmd: 'updateUser' },
      { id, ...updateUserDto },
    );
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string): Observable<any> {
    return this.usersClient.send({ cmd: 'deleteUser' }, { id });
  }
}
