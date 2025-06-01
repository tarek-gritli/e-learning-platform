import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards} from '@nestjs/common';
import { RolesDecorator } from 'src/auth/roles.decorator';
import { Role } from 'generated/prisma';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { InstructorService } from './instructor.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiBearerAuth('access-token')
@ApiCookieAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal Server Error' })
@Controller('instructor')
export class InstructorController {
  constructor(private readonly InstructorService: InstructorService) {}

  @Post("/invite/:studentId/course/:courseId")
  @ApiOperation({ summary: 'sending an  invitation to a user(instructor only)' })
  @ApiResponse({ status: 201, description: 'Invitation sent to student' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.INSTRUCTOR)
  @UseGuards(RolesGuard)
  inviteStudentToCourse(@Param('studentId') studentId: string, @Param('courseId') courseId: string) {
    return this.InstructorService.inviteStudentToCourse(studentId, courseId);
  }

  @Delete("/kick/:studentId/course/:courseId")
  @ApiOperation({ summary: 'kick a student from a course(instructor only)' })
  @ApiResponse({ status: 201, description: 'Student kicked successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.INSTRUCTOR)
  @UseGuards(RolesGuard)
  KickStudentFromCourse(@Param('studentId') studentId: string, @Param('courseId') courseId: string) {
    return this.InstructorService.kickStudentFromCourse(studentId, courseId);
  }
  
  @Patch('/complete/course/:courseId')
  @ApiOperation({ summary: 'Mark that couse as completed (instructor only)' })
  @ApiResponse({ status: 200, description: 'All enrollments marked as completed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.INSTRUCTOR)
  @UseGuards(RolesGuard)
  markAllCourseEnrollmentsAsCompleted(@Param('courseId') courseId: string) {
  return this.InstructorService.markAllEnrollmentsAsCompleted(courseId);
  }
}
