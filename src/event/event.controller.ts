import { Controller, MessageEvent, Query, Sse } from '@nestjs/common';
import { EventService } from './event.service';
import { Observable } from 'rxjs';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Sse('stream')
  stream(@Query('token') token: string): Observable<MessageEvent> {
    return this.eventService.stream(token);
  }
}
