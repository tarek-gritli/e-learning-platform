import { Injectable ,BadRequestException, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class InstructorService {
  constructor(private readonly prisma: PrismaService) {}
  async inviteStudentToCourse(studentId: string, courseId: string): Promise<string> {
    const studentIdNum = parseInt(studentId, 10);
    const courseIdNum = parseInt(courseId, 10);

    // Validate student
    const student = await this.prisma.user.findUnique({ where: { id: studentIdNum } });
    if (!student || student.role !== 'STUDENT') {
      throw new NotFoundException('Student not found or invalid role');
    }

    // Validate course
    const course = await this.prisma.course.findUnique({ where: { id: courseIdNum } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if already enrolled or invited
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: studentIdNum,
          courseId: courseIdNum,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Student already invited or enrolled in this course');
    }

    // Create pending enrollment
    await this.prisma.enrollment.create({
      data: {
        studentId: studentIdNum,
        courseId: courseIdNum,
        status: 'PENDING',
      },
    });

    return `Invitation sent: Student ${studentId} invited to Course ${courseId}`;
  }

  async kickStudentFromCourse(studentId: string, courseId: string): Promise<string> {
  const studentIdNum = parseInt(studentId, 10);
  const courseIdNum = parseInt(courseId, 10);

  // Check if enrollment exists
  const enrollment = await this.prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: studentIdNum,
        courseId: courseIdNum,
      },
    },
  });

  if (!enrollment) {
    throw new NotFoundException('Enrollment not found for the given student and course.');
  }

  // Delete the enrollment
  await this.prisma.enrollment.delete({
    where: {
      studentId_courseId: {
        studentId: studentIdNum,
        courseId: courseIdNum,
      },
    },
  });

    return `Student ${studentId} has been kicked from course ${courseId}`;
  }

  async markAllEnrollmentsAsCompleted(courseId: string): Promise<string> {
    const courseIdNum = parseInt(courseId, 10);

    // Find enrollments that are not yet completed
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        courseId: courseIdNum,
        status: { not: 'COMPLETED' },
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
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
    );

    await Promise.all(updatePromises);

    return `Marked ${enrollments.length} enrollments as COMPLETED for course ${courseId}`;
  }

}
