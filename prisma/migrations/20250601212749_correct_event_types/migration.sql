/*
  Warnings:

  - The values [STUDENT_KICKED_FROM_COURSE,COURSE_COMPLETED] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('STUDENT_DROPPED_FROM_COURSE', 'STUDENT_ENROLLED_IN_COURSE', 'STUDENT_REJECTED_ENROLLMENT_FROM_COURSE', 'COURSE_CREATED', 'COURSE_UPDATED', 'COURSE_DELETED', 'INSTRUCTOR_INVITED_STUDENT', 'INSTRUCTOR_KICKED_STUDENT', 'INSTRUCTOR_COMPLETED_COURSE');
ALTER TABLE "events" ALTER COLUMN "type" TYPE "EventType_new" USING ("type"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";
COMMIT;
