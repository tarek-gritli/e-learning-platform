import { Module } from '@nestjs/common';
import { ChatGateway } from './chatGateway';
import { CourseChatService } from './course-chat.service';
@Module({
  providers: [ChatGateway, CourseChatService],
  exports: [ChatModule], 
})
export class ChatModule { }