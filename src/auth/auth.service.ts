import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { EmailVerificationDto } from './dto/email-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { generateTokenWithExpiration } from 'src/common/utils/helpers';
import { Role } from 'generated/prisma';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.userService.findBy({ username });
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (!user.isVerified) throw new ForbiddenException('Email is not verified');

    return user;
  }

  async login(loginDto: LoginDto, res: Response) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    const accessToken = await this.generateToken(
      user!.id,
      loginDto.username,
      user!.role,
    );
    this.setCookies(res, accessToken);

    return {
      user,
      accessToken,
    };
  }

  async register(createUserDto: CreateUserDto) {
    const newUser = await this.userService.create(createUserDto);

    const { token: verificationToken, expiresAt: verificationTokenExpiration } =
      generateTokenWithExpiration(32, 24);

    await this.userService.updateVerificationToken(
      newUser.id,
      verificationToken,
      verificationTokenExpiration,
    );

    await this.emailService.sendVerificationEmail(
      newUser.email,
      newUser.firstName + ' ' + newUser.lastName,
      verificationToken,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      user: newUser,
    };
  }

  logout(res: Response) {
    this.clearCookies(res);
    return { message: 'Logged out successfully' };
  }

  async verifyEmail(emailVerificationDto: EmailVerificationDto) {
    const { token } = emailVerificationDto;
    const user = await this.userService.findByVerificationToken(token);
    if (!user) {
      throw new ForbiddenException('Invalid or expired verification token');
    }
    if (
      user.verifyTokenExpires &&
      new Date() > new Date(user.verifyTokenExpires)
    )
      throw new ForbiddenException('Invalid or expired verification token');

    await this.userService.verifyUser(user.id);
    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userService.findBy({ email }, false);
    if (!user) {
      return {
        message:
          'If this email is registered and not verified, a verification email has been sent. Please check your inbox or spam folder.',
      };
    }
    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }
    const { token: verificationToken, expiresAt: verificationTokenExpiration } =
      generateTokenWithExpiration(32, 24);

    await this.userService.updateVerificationToken(
      user.id,
      verificationToken,
      verificationTokenExpiration,
    );

    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName + ' ' + user.lastName,
      verificationToken,
    );
    return {
      message:
        'If this email is registered and not verified, a verification email has been sent. Please check your inbox or spam folder.',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.userService.findBy({ email }, false);
    if (!user) {
      return {
        message:
          'If this email is registered, a reset link has been sent. Please check your inbox or spam folder.',
      };
    }
    const { token: resetToken, expiresAt: resetTokenExpiration } =
      generateTokenWithExpiration();

    await this.userService.updateResetToken(
      user.id,
      resetToken,
      resetTokenExpiration,
    );

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.firstName + ' ' + user.lastName,
      resetToken,
    );
    return {
      message:
        'Password reset email sent. Please check your inbox or spam folder.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    const user = await this.userService.findByResetToken(token);
    if (!user) {
      throw new ForbiddenException('Invalid or expired reset token');
    }
    if (
      user.resetPassTokenExpires &&
      new Date() > new Date(user.resetPassTokenExpires)
    )
      throw new ForbiddenException('Invalid or expired reset token');

    await this.userService.update(user.id, { password });

    await this.userService.updateResetToken(user.id, null, null);

    return { message: 'Password reset successfully' };
  }

  async generateToken(userId: number, username: string, role: Role) {
    try {
      return await this.jwtService.signAsync(
        { sub: userId, username, role: role },
        {
          expiresIn: '30d',
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(error, 'Error generating token');
    }
  }

  setCookies(res: Response, accessToken: string) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  clearCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
  }
}
