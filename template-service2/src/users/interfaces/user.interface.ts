export interface User {
  id: string;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  username: string;
  email: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
}
