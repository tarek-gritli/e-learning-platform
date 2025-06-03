import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [EventService, JwtService],
  controllers: [EventController],
  exports: [EventService],
})
export class EventModule {}
