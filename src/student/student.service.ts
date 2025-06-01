import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseService } from 'src/course/course.service';
import { EnrollmentStatus } from 'generated/prisma';

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseService: CourseService,
  ) {}

  async rejectEnrollment(courseId: number, studentId: number) {
    const course = await this.courseService.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        courseId: courseId,
        studentId: studentId,
        status: EnrollmentStatus.PENDING,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    return `Enrollment ${enrollment.id} rejected successfully`;
  }

  async acceptEnrollment(courseId: number, studentId: number) {
    const course = await this.courseService.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        courseId: courseId,
        studentId: studentId,
        status: EnrollmentStatus.PENDING,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.ACTIVE,
      },
    });

    return `Enrollment ${enrollment.id} accepted successfully`;
  }

  async dropFromCourse(courseId: number, studentId: number) {
    const course = await this.courseService.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        courseId: courseId,
        studentId: studentId,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        'Active enrollment not found for this course and student',
      );
    }

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.DROPPED,
      },
    });

    return `Successfully dropped enrollment ${enrollment.id}`;
  }
}
