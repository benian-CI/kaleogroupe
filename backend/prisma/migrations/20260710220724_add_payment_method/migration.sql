-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cinetpay', 'cash');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cinetpay';
