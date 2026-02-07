/*
  Warnings:

  - Added the required column `companyId` to the `PayrollEmployeePayItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PayrollEmployeePayItem" ADD COLUMN     "companyId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PayrollEmployeePayItem" ADD CONSTRAINT "PayrollEmployeePayItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
