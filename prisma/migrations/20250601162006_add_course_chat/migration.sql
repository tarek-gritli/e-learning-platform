-- CreateTable
CREATE TABLE "course_conversations" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_messages" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "reactions" JSONB NOT NULL DEFAULT '{}',
    "comments" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "course_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_conversations_courseId_key" ON "course_conversations"("courseId");

-- AddForeignKey
ALTER TABLE "course_conversations" ADD CONSTRAINT "course_conversations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_messages" ADD CONSTRAINT "course_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_messages" ADD CONSTRAINT "course_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "course_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
