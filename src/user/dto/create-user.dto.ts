import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'john_doe',
    minLength: 3,
    maxLength: 25,
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 25)
  username: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'securePassword123',
    minLength: 6,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 100)
  password: string;

  @ApiProperty({
    description: 'Avatar URL for the user',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'Bio or description for the user',
    example: 'Software developer with a passion for open source.',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;
}
