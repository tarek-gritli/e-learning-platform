/*
  Warnings:

  - Made the column `fileUrl` on table `course_materials` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "course_materials" ALTER COLUMN "fileUrl" SET NOT NULL;
