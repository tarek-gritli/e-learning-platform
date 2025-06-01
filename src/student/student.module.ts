import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { CourseModule } from 'src/course/course.module';

@Module({
  imports: [CourseModule],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
