import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EventService } from './event.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RolesDecorator } from 'src/auth/roles.decorator';
import { Role } from 'generated/prisma';
import { Observable } from 'rxjs';

@ApiBearerAuth('access-token')
@ApiCookieAuth('access-token')
@RolesDecorator(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.eventService.stream();
  }
}
