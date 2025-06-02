import { Module } from '@nestjs/common';
import { CourseMaterialsController } from './course-materials.controller';
import { CourseMaterialsService } from './course-materials.service';

@Module({
  controllers: [CourseMaterialsController],
  providers: [CourseMaterialsService],
  exports: [CourseMaterialsService],
})
export class CourseMaterialsModule {}
