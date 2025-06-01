import {
  Controller,
  Post,
  Patch,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
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
import { RequestWithUser } from 'src/common/types/auth.types';

@ApiBearerAuth('access-token')
@ApiCookieAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal Server Error' })
@Controller('instructor')
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Post('courses/:courseId/students/:studentId/invite')
  @ApiOperation({
    summary: 'sending an  invitation to a student(instructor only)',
  })
  @ApiResponse({ status: 201, description: 'Invitation sent to student' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.INSTRUCTOR)
  @UseGuards(RolesGuard)
  inviteStudentToCourse(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.instructorService.inviteStudentToCourse(
      studentId,
      courseId,
      req.user.id,
    );
  }

  @Patch('courses/:courseId/students/:studentId/kick/')
  @ApiOperation({ summary: 'kick a student from a course(instructor only)' })
  @ApiResponse({ status: 201, description: 'Student kicked successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.INSTRUCTOR)
  @UseGuards(RolesGuard)
  kickStudentFromCourse(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.instructorService.kickStudentFromCourse(
      studentId,
      courseId,
      req.user.id,
    );
  }

  @Patch('courses/:courseId/complete')
  @ApiOperation({ summary: 'Mark that couse as completed (instructor only)' })
  @ApiResponse({
    status: 200,
    description: 'All enrollments marked as completed',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.INSTRUCTOR)
  @UseGuards(RolesGuard)
  markAllCourseEnrollmentsAsCompleted(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.instructorService.markAllEnrollmentsAsCompleted(
      courseId,
      req.user.id,
    );
  }
}
