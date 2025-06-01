import { StudentService } from './student.service';
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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiBearerAuth('access-token')
@ApiCookieAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal Server Error' })
@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

    @Delete("/drop/:enrollementId")
    @ApiOperation({ summary: 'drop a course(student only)' })
    @ApiResponse({ status: 201, description: 'Student dropped successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @RolesDecorator(Role.STUDENT)
    @UseGuards(RolesGuard)
    DropFromCourse(@Param('enrollementId') enrollementId: string) {
      return this.studentService.dropFromCourse(enrollementId);
    }
    
    @Delete("/reject/:enrollmentId")
    @ApiOperation({ summary: 'Reject enrollement in a course(student only)' })
    @ApiResponse({ status: 201, description: 'Enrollement rejected successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @RolesDecorator(Role.STUDENT)
    @UseGuards(RolesGuard)
    RejectEnrollement(@Param('enrollmentId') enrollmentId: string) {
      return this.studentService.RejectEnrollement(enrollmentId);
    }

    @Patch("/accept/:enrollmentId")
    @ApiOperation({ summary: 'accept enrollement in a course(student only)' })
    @ApiResponse({ status: 201, description: 'Enrollement accepted successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @RolesDecorator(Role.STUDENT)
    @UseGuards(RolesGuard)
    AcceptEnrollement(@Param('enrollmentId') enrollmentId: string) {
      return this.studentService.AcceptEnrollement(enrollmentId);
    }
}
