import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  Delete,
  Query,
  Post,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/types/auth.types';
import { RolesDecorator } from 'src/auth/roles.decorator';
import { Role } from 'generated/prisma';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';

@ApiBearerAuth('access-token')
@ApiCookieAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal Server Error' })
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('instructor')
  @ApiOperation({ summary: 'Create instructor account (Admin only)' })
  @ApiResponse({ status: 201, description: 'Instructor successfully created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @RolesDecorator(Role.ADMIN)
  @UseGuards(RolesGuard)
  createInstructor(@Body() createInstructorDto: CreateUserDto) {
    return this.userService.create(createInstructorDto, true);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: 'Filter users by role',
  })
  @RolesDecorator(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Query() paginationDto: PaginationDto, @Query('role') role?: Role) {
    return this.userService.findAll(paginationDto, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returned user by id' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.ADMIN)
  @UseGuards(RolesGuard)
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findBy({ id });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user by ID (Admin only - cannot update other admins)',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot update admin users',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @RolesDecorator(Role.ADMIN)
  @UseGuards(RolesGuard)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    const targetUser = await this.userService.findBy({ id });

    if (targetUser!.role === Role.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('Cannot update admin users');
    }

    return this.userService.update(id, updateUserDto);
  }

  @Patch('/profile')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({ status: 200, description: 'User profile updated' })
  update(
    @Req() request: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(request.user.id, updateUserDto);
  }

  @Delete('/delete')
  @ApiOperation({ summary: 'Delete my account' })
  @ApiResponse({ status: 200, description: 'User account deleted' })
  deleteMyAccount(@Req() request: RequestWithUser) {
    return this.userService.remove(request.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User account deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.ADMIN)
  @UseGuards(RolesGuard)
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: RequestWithUser,
  ) {
    return this.userService.deleteUser(id, request.user.id);
  }
}
