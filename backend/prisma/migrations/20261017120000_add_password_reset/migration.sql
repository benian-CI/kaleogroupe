-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenHash" TEXT,
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_passwordResetTokenHash_key" ON "Customer"("passwordResetTokenHash");
