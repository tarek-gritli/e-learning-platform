import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MaterialType } from 'generated/prisma';

export class CreateCourseMaterialDto {
  @ApiProperty({
    description: 'The title of the course material',
    example: 'Introduction to NestJS',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Type of the course material',
    example: 'PDF',
    enum: MaterialType,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(MaterialType)
  type: MaterialType;
}
