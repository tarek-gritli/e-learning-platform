import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { EmailVerificationDto } from './dto/email-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ResendEmailVerificationDto } from './dto/resend-email.dto';
import { RequestWithUser } from 'src/common/types/auth.types';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in and received access token',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Invalid credentials' })
  @UseGuards(LocalAuthGuard)
  login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(loginDto, res);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description:
      'User successfully registered and waiting for email verification',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 409,
    description: 'User with this email or username already exists',
  })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('verify-email')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify email' })
  @ApiBody({ type: EmailVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified',
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(@Body() emailVerificationDto: EmailVerificationDto) {
    return await this.authService.verifyEmail(emailVerificationDto);
  }

  @Post('resend-verification')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiBody({ type: ResendEmailVerificationDto })
  @ApiResponse({
    status: 200,
    description:
      'If this email is registered and not verified, a verification email has been sent. Please check your inbox or spam folder.',
  })
  @ApiResponse({
    status: 400,
    description: 'Email already verified',
  })
  async resendVerificationEmail(
    @Body() resendEmailVerificationDto: ResendEmailVerificationDto,
  ) {
    return await this.authService.resendVerificationEmail(
      resendEmailVerificationDto.email,
    );
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Forgot password' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description:
      'If this email is registered, a password reset email has been sent. Please check your inbox or spam folder.',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid or expired reset token',
  })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
  })
  @ApiCookieAuth('access-token')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
  })
  @ApiCookieAuth('access-token')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(res);
  }
}
