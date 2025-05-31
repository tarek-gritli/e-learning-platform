import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, Role } from 'generated/prisma';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    await this.checkIfUserExists(createUserDto.email, createUserDto.username);

    const password = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password,
      },
    });
  }

  async findBy(where: Prisma.UserWhereUniqueInput, throwIfNotFound = true) {
    const user = await this.prisma.user.findUnique({
      where,
    });

    if (!user && throwIfNotFound) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll() {
    return await this.prisma.user.findMany({});
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findBy({ id });

    // check if email or username already exists
    if (updateUserDto.email || updateUserDto.username)
      await this.checkIfUserExists(
        updateUserDto.email,
        updateUserDto.username,
        id,
      );
    // hash password if it is being updated
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return await this.prisma.user.update({
      where: { id },
      data: {
        username: updateUserDto.username ?? user!.username,
        email: updateUserDto.email ?? user!.email,
        firstName: updateUserDto.firstName ?? user!.firstName,
        lastName: updateUserDto.lastName ?? user!.lastName,
        avatar: updateUserDto.avatar ?? user!.avatar,
        bio: updateUserDto.bio ?? user!.bio,
        password: updateUserDto.password ?? user!.password,
      },
    });
  }

  async remove(id: number) {
    await this.findBy({ id });

    return await this.prisma.user.delete({
      where: { id },
    });
  }

  async deleteUser(id: number, loggedInUserId: number) {
    if (id === loggedInUserId) {
      throw new ConflictException('You cannot delete your own account');
    }

    const targetUser = await this.findBy({ id });

    if (targetUser!.role === Role.ADMIN) {
      throw new ForbiddenException('You cannot delete an admin user');
    }

    return await this.prisma.user.delete({
      where: { id },
    });
  }

  async findByVerificationToken(token: string) {
    return await this.prisma.user.findFirst({
      where: { verifyToken: token },
    });
  }

  async verifyUser(id: number): Promise<void> {
    await this.findBy({ id });

    await this.prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
        verifyToken: null,
        verifyTokenExpires: null,
      },
    });
  }

  async updateVerificationToken(
    id: number,
    token: string,
    verificationTokenExpiration: Date | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        verifyToken: token,
        verifyTokenExpires: verificationTokenExpiration,
      },
    });
  }

  async findByResetToken(token: string) {
    return await this.prisma.user.findFirst({
      where: { resetPassToken: token },
    });
  }

  async updateResetToken(
    id: number,
    token: string | null,
    resetTokenExpiration: Date | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        resetPassToken: token,
        resetPassTokenExpires: resetTokenExpiration,
      },
    });
  }

  private async checkIfUserExists(
    email?: string,
    username?: string,
    excludeId?: number,
  ) {
    if (!email && !username) return;
    const conditions: Prisma.UserWhereInput[] = [];
    if (email) conditions.push({ email });
    if (username) conditions.push({ username });

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: conditions,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
    if (!existingUser) return;

    throw new ConflictException(
      'User with this email or username already exists',
    );
  }
}
