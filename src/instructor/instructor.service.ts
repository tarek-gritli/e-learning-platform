import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseService } from 'src/course/course.service';
import { EnrollmentStatus, EventType } from 'generated/prisma';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { create } from 'domain';

@Injectable()
export class InstructorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseService: CourseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async inviteStudentToCourse(
    studentId: number,
    courseId: number,
    instructorId: number,
  ) {
    // Validate student
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student || student.role !== 'STUDENT') {
      throw new NotFoundException('Student not found');
    }

    // Validate course and check ownership
    const course = await this.courseService.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You are not the instructor of this course');
    }

    // Check if already enrolled or invited
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
        status: {
          in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PENDING],
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Student already invited or enrolled in this course',
      );
    }

    // Create pending enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        status: EnrollmentStatus.PENDING,
      },
    });

    this.eventEmitter.emit(EventType.INSTRUCTOR_INVITED_STUDENT, {
      type: EventType.INSTRUCTOR_INVITED_STUDENT,
      userId: instructorId,
      payload: {
        enrollment,
        course,
        student,
      },
      createdAt: new Date(),
    });

    return enrollment;
  }

  async kickStudentFromCourse(
    studentId: number,
    courseId: number,
    instructorId: number,
  ) {
    const course = await this.courseService.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You are not the instructor of this course');
    }

    // Check if enrollment exists
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        'Enrollment not found for the given student and course.',
      );
    }

    // Delete the enrollment
    const newEnrollment = await this.prisma.enrollment.update({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      data: {
        status: EnrollmentStatus.KICKED,
      },
    });

    this.eventEmitter.emit(EventType.INSTRUCTOR_KICKED_STUDENT, {
      type: EventType.INSTRUCTOR_KICKED_STUDENT,
      userId: instructorId,
      payload: {
        course,
        oldEnrollment: enrollment,
        newEnrollment,
      },
      createdAt: new Date(),
    });

    return newEnrollment;
  }

  async markAllEnrollmentsAsCompleted(courseId: number, instructorId: number) {
    const course = await this.courseService.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You are not the instructor of this course');
    }

    // Find enrollments that are not yet completed
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        courseId,
        status: { not: EnrollmentStatus.COMPLETED },
      },
    });

    if (enrollments.length === 0) {
      return `No enrollments to update for course ${courseId}`;
    }

    // Update all enrollments to COMPLETED
    const updatePromises = enrollments.map((enrollment) =>
      this.prisma.enrollment.update({
        where: {
          studentId_courseId: {
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
          },
        },
        data: {
          status: EnrollmentStatus.COMPLETED,
          completedAt: new Date(),
        },
      }),
    );

    await Promise.all(updatePromises);

    this.eventEmitter.emit(EventType.INSTRUCTOR_COMPLETED_COURSE, {
      type: EventType.INSTRUCTOR_COMPLETED_COURSE,
      userId: instructorId,
      payload: {
        course,
      },
      createdAt: new Date(),
    });

    return `Marked ${enrollments.length} enrollments as COMPLETED for course ${courseId}`;
  }
}
