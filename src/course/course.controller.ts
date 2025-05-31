import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RolesDecorator } from 'src/auth/roles.decorator';
import { Role } from 'generated/prisma';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { RequestWithUser } from 'src/common/types/auth.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiBearerAuth('access-token')
@ApiCookieAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal Server Error' })
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a course (Instructor only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @RolesDecorator(Role.INSTRUCTOR)
  create(
    @Body() createCourseDto: CreateCourseDto,
    @Req() req: RequestWithUser,
  ) {
    return this.courseService.create(createCourseDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Return all courses' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of courses per page',
  })
  @ApiResponse({ status: 200, description: 'List of courses returned' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query parameters',
  })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.user.id;
    const userRole = request.user.role;
    return this.courseService.findAll(paginationDto, userId, userRole);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get students enrolled in a course' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Course ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of students per page',
  })
  @ApiResponse({
    status: 200,
    description: 'List of students enrolled in the course returned',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @RolesDecorator(Role.INSTRUCTOR, Role.STUDENT)
  getStudentsInCourse(
    @Param('id', ParseIntPipe) courseId: number,
    @Query() paginationDto: PaginationDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.courseService.getEnrolledStudents(
      courseId,
      paginationDto,
      userId,
      userRole,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a course (Instructor only)' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @RolesDecorator(Role.INSTRUCTOR)
  updateCourse(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) courseId: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.courseService.update(courseId, updateCourseDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a course (Instructor only)' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @RolesDecorator(Role.INSTRUCTOR)
  deleteCourse(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) courseId: number,
  ) {
    return this.courseService.delete(courseId, req.user.id);
  }
}
