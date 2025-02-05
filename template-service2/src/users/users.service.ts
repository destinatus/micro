import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User, CreateUserDto, UpdateUserDto } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<User[]> {
    return this.databaseService.query<User>(
      'SELECT * FROM users ORDER BY created_at DESC'
    );
  }

  async findOne(id: string): Promise<User | null> {
    return this.databaseService.queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const result = await this.databaseService.queryOne<User>(
      'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
      [createUserDto.username, createUserDto.email]
    );
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (updateUserDto.username) {
      setClause.push(`username = $${paramCount}`);
      values.push(updateUserDto.username);
      paramCount++;
    }

    if (updateUserDto.email) {
      setClause.push(`email = $${paramCount}`);
      values.push(updateUserDto.email);
      paramCount++;
    }

    if (setClause.length === 0) {
      return this.findOne(id);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    return this.databaseService.queryOne<User>(query, values);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.databaseService.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.length > 0;
  }
}
