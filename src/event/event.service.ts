import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, MessageEvent } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CreateEventDto } from './dto/create-event.dto';
import { EventType, Role } from 'generated/prisma';
import { filter, fromEvent, map, merge, Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/common/types/auth.types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  stream(token: string): Observable<MessageEvent> {
    console.log('SSE connection established');
    console.log('Token: ', token);

    if (!token) {
      throw new Error('Token is required for SSE connection');
    }

    const decoded: JwtPayload = this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    const eventTypes = Object.values(EventType);
    const eventStreams = eventTypes.map((type) =>
      fromEvent(this.eventEmitter, type),
    );

    return merge(...eventStreams).pipe(
      filter(() => {
        return decoded.role === Role.ADMIN;
      }),
      map((event) => {
        console.log('Streaming event: ', event);
        return {
          data: event,
        } as MessageEvent;
      }),
    );
  }
}
