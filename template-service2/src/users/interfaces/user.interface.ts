import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class User {
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'The username of the user' })
  username: string;

  @ApiProperty({ description: 'The email address of the user' })
  email: string;

  @ApiProperty({ description: 'The timestamp when the user was created' })
  created_at: Date;

  @ApiProperty({ description: 'The timestamp when the user was last updated' })
  updated_at: Date;
}

export class CreateUserDto {
  @ApiProperty({ description: 'The username of the user', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'The email address of the user', example: 'john@example.com' })
  email: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'The username of the user', example: 'johndoe' })
  username?: string;

  @ApiPropertyOptional({ description: 'The email address of the user', example: 'john@example.com' })
  email?: string;
}
