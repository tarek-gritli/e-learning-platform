import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

// Dummy auth context for demonstration (replace with real auth in production)
function getCurrentUserId(context: any) {
  // In real app, extract userId from context/session/token
  return context?.userId || 1; // fallback to user 1 for demo
}

export const resolvers = {
  Query: {
    course: async (_: any, args: { id: number }) => {
      return prisma.course.findUnique({
        where: { id: args.id },
        include: {
          materials: true,
          enrollments: {
            include: { student: true },
          },
        },
      });
    },
    me: async (_: any, __: any, context: any) => {
      const userId = getCurrentUserId(context);
      return prisma.user.findUnique({
        where: { id: userId },
        include: {
          createdCourses: {
            include: {
              materials: true,
              enrollments: { include: { student: true } },
            },
          },
        },
      });
    },
  },
  User: {
    createdCourses: (parent: any) => parent.createdCourses,
  },
  Course: {
    students: (parent: any) => parent.enrollments ? parent.enrollments.map((e: any) => e.student) : [],
    enrollments: async (parent: any, args: { status?: string }) => {
      // Always fetch enrollments from the database to support filtering
      const where: any = { courseId: parent.id };
      if (args.status) where.status = args.status;
      return prisma.enrollment.findMany({
        where,
        include: { student: true },
      });
    },
  },
  Enrollment: {
    student: (parent: any) => parent.student,
  },
};
