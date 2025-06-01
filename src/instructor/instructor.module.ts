import { Module } from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { InstructorController } from './instructor.controller';
import { CourseModule } from 'src/course/course.module';

@Module({
  imports: [CourseModule],
  controllers: [InstructorController],
  providers: [InstructorService],
})
export class InstructorModule {}
