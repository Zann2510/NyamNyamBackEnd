/*
  Warnings:

  - A unique constraint covering the columns `[receiptNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "receiptNumber" TEXT,
ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "tax" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "subtotal" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Order_receiptNumber_key" ON "Order"("receiptNumber");

-- CreateIndex
CREATE INDEX "Order_receiptNumber_idx" ON "Order"("receiptNumber");
