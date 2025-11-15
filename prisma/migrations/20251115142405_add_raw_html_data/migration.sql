-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "rawHtmlData" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;
