import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/types/auth.types';
import { RolesDecorator } from 'src/auth/roles.decorator';
import { Role } from 'generated/prisma';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RolesDecorator(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @RolesDecorator(Role.ADMIN)
  @UseGuards(RolesGuard)
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findBy({ id });
  }

  @Patch('/profile')
  update(
    @Req() request: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(request.user.id, updateUserDto);
  }
}
