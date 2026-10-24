import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../common/public.decorator';
import { AuthService } from './auth.service';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_MS,
} from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

// Limit auth endpoint attempts to 10 requests per minute per address.
@Public()
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.sendAuthResponse(await this.authService.signup(dto), response);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.sendAuthResponse(await this.authService.login(dto), response);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.getRefreshToken(request);
    if (!token) {
      this.clearRefreshCookie(response);
      throw new UnauthorizedException('Please log in');
    }

    try {
      return this.sendAuthResponse(
        await this.authService.refresh(token),
        response,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.clearRefreshCookie(response);
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    try {
      await this.authService.logout(this.getRefreshToken(request));
    } finally {
      this.clearRefreshCookie(response);
    }
  }

  private sendAuthResponse(
    result: Awaited<ReturnType<AuthService['signup']>>,
    response: Response,
  ) {
    const { refreshToken, ...authResponse } = result;
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
    return authResponse;
  }

  private getRefreshToken(request: Request): string | undefined {
    const prefix = `${REFRESH_COOKIE_NAME}=`;
    const cookie = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));
    return cookie?.slice(prefix.length);
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
    });
  }
}
