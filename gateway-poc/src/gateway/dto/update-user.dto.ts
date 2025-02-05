import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'The username of the user',
    example: 'johndoe',
    required: false,
  })
  username?: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'newpassword123',
    required: false,
  })
  password?: string;
}
