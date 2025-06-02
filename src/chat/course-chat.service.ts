// src/course-chat/course-chat.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseChatService {
  constructor(private prisma: PrismaService) {}

  // Get or create a conversation for a course
  async getOrCreateConversation(courseId: number) {
    if (typeof courseId !== 'number' || isNaN(courseId) || courseId <= 0) {
      throw new Error('Invalid courseId provided to getOrCreateConversation');
    }
    let conversation = await this.prisma.courseConversation.findUnique({
      where: { courseId },
      include: { messages: { include: { user: true } } },
    });

    if (!conversation) {
      conversation = await this.prisma.courseConversation.create({
        data: { courseId },
        include: { messages: { include: { user: true } } },
      });
    }
    return conversation;
  }

  // Fetch all messages for a course
  async getMessages(courseId: number) {
    const conversation = await this.getOrCreateConversation(courseId);
    return conversation.messages;
  }

  // Add a new message to the course conversation
  async createMessage(courseId: number, userId: number, content: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with id ${userId} does not exist. Cannot create message.`);
    }
    // Check if user is enrolled in the course with ACTIVE status
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        courseId,
        studentId: userId,
        status: 'ACTIVE',
      },
    });
    // Also check if user is the instructor
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    const isInstructor = course && course.instructorId === userId;
    if (!enrollment && !isInstructor) {
      throw new Error('User must be actively enrolled in the course or be the instructor to send messages.');
    }
    const conversation = await this.getOrCreateConversation(courseId);
    const message = await this.prisma.courseMessage.create({
      data: {
        text: content,
        conversationId: conversation.id,
        userId,
      },
      include: {
        user: true,
      },
    });

    return message;
  }

  // Add a new method to get all active student IDs and instructor for a course
  async getActiveRecipients(courseId: number): Promise<number[]> {
    const activeEnrollments = await this.prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      select: { studentId: true },
    });
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    const instructorId = course?.instructorId;
    const recipientIds = [
      ...activeEnrollments.map(e => e.studentId),
      instructorId,
    ].filter((v, i, a) => typeof v === 'number' && a.indexOf(v) === i) as number[]; // unique, non-null, number only
    return recipientIds;
  }
}
