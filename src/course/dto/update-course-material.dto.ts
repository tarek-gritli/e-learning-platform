import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCourseMaterialDto {
  @ApiProperty({
    description: 'The title of the course material',
    example: 'Updated Course Material Title',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  title?: string;
}
