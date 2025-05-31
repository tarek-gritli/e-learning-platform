import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Title of the course',
    example: 'Introduction to Programming',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Description of the course',
    example: 'This course covers the basics of programming using Python.',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
