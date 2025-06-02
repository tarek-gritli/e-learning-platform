import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Query,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RolesDecorator } from 'src/auth/roles.decorator';
import { Role } from 'generated/prisma';
import { RequestWithUser } from 'src/common/types/auth.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CourseMaterialsService } from './course-materials.service';
import { CreateCourseMaterialDto } from './dto/create-course-material.dto';
import { UpdateCourseMaterialDto } from './dto/update-course-material.dto';
import { diskStorage } from 'multer';
import * as path from 'path';

@ApiTags('Course Materials')
@ApiBearerAuth('access-token')
@ApiCookieAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses/:courseId/materials')
export class CourseMaterialsController {
  constructor(private readonly courseMaterialService: CourseMaterialsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'uploads', 'course-materials'),
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const fileExtension = file.originalname.split('.').pop();
          const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
          cb(null, fileName);
        },
      }),
      fileFilter(req, file, cb) {
        if (file.mimetype !== 'application/pdf') {
          return cb(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @ApiOperation({ summary: 'Upload course material (Instructor only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to upload',
        },
        title: {
          type: 'string',
          description: 'Title of the material',
        },
        type: {
          type: 'string',
          enum: ['PDF'],
          description: 'Type of the material',
        },
      },
      required: ['file', 'title', 'type'],
    },
  })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'Course ID',
  })
  @ApiResponse({ status: 201, description: 'Material uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data or file',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @RolesDecorator(Role.INSTRUCTOR)
  async create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() createCourseMaterialDto: CreateCourseMaterialDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.courseMaterialService.create(
      courseId,
      createCourseMaterialDto,
      file,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all materials for a course' })
  @ApiParam({
    name: 'courseId',
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
    description: 'Number of materials per page',
  })
  @ApiResponse({
    status: 200,
    description: 'List of course materials returned',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @RolesDecorator(Role.INSTRUCTOR, Role.STUDENT)
  findAll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query() paginationDto: PaginationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.courseMaterialService.findAll(
      courseId,
      paginationDto,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific course material' })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'Course ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Material ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Course material details returned',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Material not found' })
  @RolesDecorator(Role.INSTRUCTOR, Role.STUDENT)
  findOne(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.courseMaterialService.findOne(
      id,
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download course material file' })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'Course ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Material ID',
  })
  @ApiResponse({
    status: 200,
    description: 'File download started',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Material or file not found' })
  @RolesDecorator(Role.INSTRUCTOR, Role.STUDENT)
  async downloadFile(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const fileData = await this.courseMaterialService.downloadFile(
      id,
      courseId,
      req.user.id,
      req.user.role,
    );

    res.set({
      'Content-Type': fileData.mimetype,
      'Content-Disposition': `attachment; filename="${fileData.filename}"`,
    });

    res.send(fileData.buffer);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update course material (Instructor only)' })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'Course ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Material ID',
  })
  @ApiResponse({ status: 200, description: 'Material updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Material not found' })
  @RolesDecorator(Role.INSTRUCTOR)
  update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseMaterialDto: UpdateCourseMaterialDto,
    @Req() req: RequestWithUser,
  ) {
    return this.courseMaterialService.update(
      id,
      updateCourseMaterialDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete course material (Instructor only)' })
  @ApiParam({
    name: 'courseId',
    type: Number,
    description: 'Course ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Material ID',
  })
  @ApiResponse({ status: 200, description: 'Material deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Material not found' })
  @RolesDecorator(Role.INSTRUCTOR)
  remove(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.courseMaterialService.remove(id, req.user.id);
  }
}
