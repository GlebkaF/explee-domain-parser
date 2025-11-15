/*
  Warnings:

  - Added the required column `updatedAt` to the `Domain` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('created', 'queued', 'running', 'completed', 'error');

-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "status" "DomainStatus" NOT NULL DEFAULT 'created',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
