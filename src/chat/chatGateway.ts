import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { CourseChatService } from './course-chat.service';

@WebSocketGateway({ cors: { origin: "*" } })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly courseChatService: CourseChatService) {}

  private server: Server;

  afterInit(server: Server) {
    this.server = server;
    console.log('WebSocket initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinCourse')
  handleJoinCourse(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    // Stringify and parse data to ensure it's a plain object
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.warn('joinCourse: Failed to parse data as JSON string:', data);
        client.emit('joinCourseError', { message: 'Invalid data format.' });
        return;
      }
    }
    // Support both { courseId: 1 } and { data: { courseId: 1 } }
    let courseId = parsedData?.courseId;
    if (typeof courseId === 'undefined' && parsedData?.data) {
      courseId = parsedData.data.courseId;
    }
    console.log('Received joinCourse data:', parsedData, 'Resolved courseId:', courseId);
    if (typeof courseId === 'undefined' || courseId === null || isNaN(Number(courseId))) {
      console.warn(`joinCourse: courseId is missing, null, or not a number in data:`, parsedData);
      client.emit('joinCourseError', { message: 'Valid courseId is required to join a course room.' });
      return;
    }
    const room = `course_${courseId}`;
    client.join(room);
    console.log(`Client ${client.id} joined room ${room}`);
    client.emit('joinCourseSuccess', { room, message: `Joined course room ${room}` });
  }

  @SubscribeMessage('sendCourseMessage')
  async handleSendCourseMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    // Stringify and parse data to ensure it's a plain object
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        console.warn('sendCourseMessage: Failed to parse data as JSON string:', data);
        client.emit('sendCourseMessageError', { message: 'Invalid data format.' });
        return;
      }
    }
    // Support both direct and nested payloads
    let courseId = parsedData?.courseId;
    let userId = parsedData?.userId;
    let username = parsedData?.username;
    let text = parsedData?.text;
    if (typeof courseId === 'undefined' && parsedData?.data) {
      courseId = parsedData.data.courseId;
      userId = parsedData.data.userId;
      username = parsedData.data.username;
      text = parsedData.data.text;
    }
    // Ensure courseId and userId are numbers
    courseId = Number(courseId);
    userId = Number(userId);
    console.log('Received sendCourseMessage data:', parsedData, 'Resolved:', { courseId, userId, username, text });
    if (
      typeof courseId === 'undefined' || courseId === null || isNaN(courseId) ||
      typeof userId === 'undefined' || userId === null || isNaN(userId) ||
      typeof username !== 'string' || !username.trim() ||
      typeof text !== 'string' || !text.trim()
    ) {
      console.warn('sendCourseMessage: Invalid or missing fields in data:', parsedData);
      client.emit('sendCourseMessageError', { message: 'All fields (courseId, userId, username, text) are required and must be valid.' });
      return;
    }
    const message = await this.courseChatService.createMessage(courseId, userId, text);
    const room = `course_${courseId}`;
    // Emit to all active students and the instructor
    const recipientIds = await this.courseChatService.getActiveRecipients(courseId);
    recipientIds.forEach(id => {
      for (const [socketId, socket] of this.server.sockets.sockets) {
        if (socket.data && socket.data.userId === id) {
          socket.emit('courseMessage', message);
        }
      }
    });
    // Also emit to the course room for backward compatibility
    this.server.to(room).emit('courseMessage', message);
  }
}
