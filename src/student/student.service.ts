import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseService } from 'src/course/course.service';
import { EnrollmentStatus, EventType } from 'generated/prisma';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseService: CourseService,
    private readonly eventEmitter: EventEmitter2,
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

    this.eventEmitter.emit(EventType.STUDENT_REJECTED_ENROLLMENT_FROM_COURSE, {
      type: EventType.STUDENT_REJECTED_ENROLLMENT_FROM_COURSE,
      userId: studentId,
      payload: {
        course,
        enrollmentRequest: enrollment,
      },
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

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.ACTIVE,
      },
    });

    this.eventEmitter.emit(EventType.STUDENT_ENROLLED_IN_COURSE, {
      type: EventType.STUDENT_ENROLLED_IN_COURSE,
      userId: studentId,
      payload: {
        course,
        oldEnrollment: enrollment,
        newEnrollment: updated,
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

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.DROPPED,
      },
    });

    this.eventEmitter.emit(EventType.STUDENT_DROPPED_FROM_COURSE, {
      type: EventType.STUDENT_DROPPED_FROM_COURSE,
      userId: studentId,
      payload: {
        course,
        oldEnrollment: enrollment,
        newEnrollment: updated,
      },
    });

    return `Successfully dropped enrollment ${enrollment.id}`;
  }
}
