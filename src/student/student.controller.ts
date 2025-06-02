import { StudentService } from './student.service';
import {
  Controller,
  Patch,
  Param,
  Delete,
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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/types/auth.types';

@ApiBearerAuth('access-token')
@ApiCookieAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal Server Error' })
@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Patch('/drop/:courseId')
  @ApiOperation({ summary: 'drop from a course(student only)' })
  @ApiResponse({ status: 200, description: 'Student dropped successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.STUDENT)
  @UseGuards(RolesGuard)
  dropFromCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.studentService.dropFromCourse(courseId, req.user.id);
  }

  @Delete('/reject/:courseId')
  @ApiOperation({ summary: 'Reject enrollment in a course(student only)' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment rejected successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.STUDENT)
  @UseGuards(RolesGuard)
  rejectEnrollment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.studentService.rejectEnrollment(courseId, req.user.id);
  }

  @Patch('/accept/:courseId')
  @ApiOperation({ summary: 'accept enrollment in a course(student only)' })
  @ApiResponse({
    status: 200,
    description: 'Enrollment accepted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.STUDENT)
  @UseGuards(RolesGuard)
  acceptEnrollment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.studentService.acceptEnrollment(courseId, req.user.id);
  }
}
