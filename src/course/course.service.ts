import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Role } from 'generated/prisma';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createCourseDto: CreateCourseDto, instructorId: number) {
    return await this.prisma.course.create({
      data: {
        ...createCourseDto,
        instructorId,
      },
    });
  }

  async findAll(paginationDto: PaginationDto, userId: number, userRole: Role) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;
    const where =
      userRole === Role.INSTRUCTOR
        ? { instructorId: userId }
        : userRole === Role.STUDENT
          ? {
              enrollments: {
                some: {
                  studentId: userId,
                },
              },
            }
          : {};

    const [courses, total] = await Promise.all([
      await this.prisma.course.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEnrolledStudents(
    courseId: number,
    paginationDto: PaginationDto,
    userId: number,
    userRole: Role,
  ) {
    const course = await this.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this course',
      );
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.enrollment.count({
        where: { courseId },
      }),
    ]);

    return {
      data: students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(courseId: number) {
    return await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: true,
        enrollments: {
          include: {
            student: true,
          },
        },
      },
    });
  }

  async update(
    courseId: number,
    updateCourseDto: UpdateCourseDto,
    instructorId: number,
  ) {
    const existingCourse = await this.findById(courseId);

    if (!existingCourse) {
      throw new NotFoundException('Course not found');
    }

    if (existingCourse.instructorId !== instructorId) {
      throw new ForbiddenException(
        'You do not have permission to update this course',
      );
    }

    return await this.prisma.course.update({
      where: { id: courseId },
      data: updateCourseDto,
    });
  }

  async delete(courseId: number, instructorId: number) {
    const existingCourse = await this.findById(courseId);

    if (!existingCourse) {
      throw new NotFoundException('Course not found');
    }

    if (existingCourse.instructorId !== instructorId) {
      throw new ForbiddenException(
        'You do not have permission to delete this course',
      );
    }

    return await this.prisma.course.delete({
      where: { id: courseId },
    });
  }
}
