import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CourseModule } from './course/course.module';
import { InstructorModule } from './instructor/instructor.module';
import { StudentModule } from './student/student.module';
import { ChatModule } from './chat/chat.module';
import { EventModule } from './event/event.module';
import { CourseMaterialsModule } from './course/course-materials.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    CourseModule,
    InstructorModule,
    StudentModule,
    ChatModule,
    EventModule,
    CourseMaterialsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
