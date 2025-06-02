import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { CreateCourseMaterialDto } from './dto/create-course-material.dto';
import { UpdateCourseMaterialDto } from './dto/update-course-material.dto';
import { EnrollmentStatus, Role } from 'generated/prisma';

@Injectable()
export class CourseMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    courseId: number,
    createCourseMaterialDto: CreateCourseMaterialDto,
    file: Express.Multer.File,
    instructorId: number,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== instructorId) {
      throw new ForbiddenException(
        'You do not have permission to add materials to this course',
      );
    }

    const material = await this.prisma.courseMaterial.create({
      data: {
        ...createCourseMaterialDto,
        fileUrl: file.path,
        courseId,
      },
    });

    return material;
  }

  async findAll(
    courseId: number,
    paginationDto: PaginationDto,
    userId: number,
    userRole: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          where: {
            studentId: userId,
            status: {
              in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const isInstructor = course.instructorId === userId;
    const isEnrolledStudent = course.enrollments.length > 0;
    const isAdmin = userRole === Role.ADMIN;

    if (!isInstructor && !isEnrolledStudent && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to view materials for this course',
      );
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [materials, total] = await Promise.all([
      this.prisma.courseMaterial.findMany({
        where: { courseId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.courseMaterial.count({
        where: { courseId },
      }),
    ]);

    return {
      data: materials,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    materialId: number,
    courseId: number,
    userId: number,
    userRole: string,
  ) {
    const material = await this.prisma.courseMaterial.findUnique({
      where: { id: materialId, courseId },
      include: {
        course: {
          include: {
            enrollments: {
              where: {
                studentId: userId,
                status: {
                  in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
                },
              },
            },
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    const isInstructor = material.course.instructorId === userId;
    const isEnrolledStudent = material.course.enrollments.length > 0;
    const isAdmin = userRole === 'ADMIN';

    if (!isInstructor && !isEnrolledStudent && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to view this material',
      );
    }

    return material;
  }

  async update(
    materialId: number,
    updateCourseMaterialDto: UpdateCourseMaterialDto,
    instructorId: number,
  ) {
    const material = await this.prisma.courseMaterial.findUnique({
      where: { id: materialId },
      include: { course: true },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    if (material.course.instructorId !== instructorId) {
      throw new ForbiddenException(
        'You do not have permission to update this material',
      );
    }

    return this.prisma.courseMaterial.update({
      where: { id: materialId },
      data: updateCourseMaterialDto,
    });
  }

  async remove(materialId: number, instructorId: number) {
    const material = await this.prisma.courseMaterial.findUnique({
      where: { id: materialId },
      include: { course: true },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    if (material.course.instructorId !== instructorId) {
      throw new ForbiddenException(
        'You do not have permission to delete this material',
      );
    }

    if (material.fileUrl) {
      try {
        await fs.unlink(material.fileUrl);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }

    await this.prisma.courseMaterial.delete({
      where: { id: materialId },
    });

    return { message: 'Material deleted successfully' };
  }

  async downloadFile(
    materialId: number,
    courseId: number,
    userId: number,
    userRole: string,
  ) {
    const material = await this.findOne(materialId, courseId, userId, userRole);

    const absolutePath = path.isAbsolute(material.fileUrl)
      ? material.fileUrl
      : path.join(process.cwd(), material.fileUrl);

    try {
      const fileBuffer = await fs.readFile(absolutePath);
      return {
        buffer: fileBuffer,
        filename: material.title + path.extname(material.fileUrl),
        mimetype:
          material.type === 'PDF'
            ? 'application/pdf'
            : 'application/octet-stream',
      };
    } catch (error) {
      throw new NotFoundException(error, 'File not found on disk');
    }
  }
}
