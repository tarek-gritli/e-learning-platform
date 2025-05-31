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
  ApiResponse,
} from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiBearerAuth('access-token')
@ApiCookieAuth('access-token')
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal Server Error' })
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @RolesDecorator(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.userService.findAll(paginationDto);
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
