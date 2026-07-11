-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "installationFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "installationRequested" BOOLEAN NOT NULL DEFAULT false;
