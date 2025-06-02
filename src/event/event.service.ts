import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, MessageEvent } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CreateEventDto } from './dto/create-event.dto';
import { EventType } from 'generated/prisma';
import { fromEvent, map, merge, Observable } from 'rxjs';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(EventType.COURSE_CREATED)
  @OnEvent(EventType.COURSE_UPDATED)
  @OnEvent(EventType.COURSE_DELETED)
  @OnEvent(EventType.INSTRUCTOR_COMPLETED_COURSE)
  @OnEvent(EventType.INSTRUCTOR_INVITED_STUDENT)
  @OnEvent(EventType.INSTRUCTOR_KICKED_STUDENT)
  @OnEvent(EventType.STUDENT_DROPPED_FROM_COURSE)
  @OnEvent(EventType.STUDENT_ENROLLED_IN_COURSE)
  @OnEvent(EventType.STUDENT_REJECTED_ENROLLMENT_FROM_COURSE)
  async createEvent(createEventDto: CreateEventDto) {
    return await this.prisma.event.create({
      data: {
        type: createEventDto.type,
        payload: createEventDto.payload,
        userId: createEventDto.userId,
      },
    });
  }

  stream(): Observable<MessageEvent> {
    console.log('SSE connection established');
    const eventTypes = Object.values(EventType);
    const eventStreams = eventTypes.map((type) =>
      fromEvent(this.eventEmitter, type),
    );

    return merge(...eventStreams).pipe(
      map((event) => {
        console.log('Streaming event: ', event);
        return {
          data: event,
        } as MessageEvent;
      }),
    );
  }
}
