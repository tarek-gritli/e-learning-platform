import { EventType } from 'generated/prisma';

export class CreateEventDto {
  type: EventType;
  payload: Record<string, any>;
  userId: number;
}
