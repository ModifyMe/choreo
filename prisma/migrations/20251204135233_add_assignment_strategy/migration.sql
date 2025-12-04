-- CreateEnum
CREATE TYPE "AssignmentStrategy" AS ENUM ('LOAD_BALANCING', 'STRICT_ROTATION', 'RANDOM', 'NONE');

-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "assignmentStrategy" "AssignmentStrategy" NOT NULL DEFAULT 'LOAD_BALANCING';
