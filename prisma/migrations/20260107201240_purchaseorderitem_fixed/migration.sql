/*
  Warnings:

  - Added the required column `companyId` to the `PurchaseOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PurchaseOrderItem" ADD COLUMN     "companyId" INTEGER NOT NULL;
