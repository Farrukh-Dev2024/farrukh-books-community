-- DropForeignKey
ALTER TABLE "CompanySubscription" DROP CONSTRAINT "CompanySubscription_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanySubscriptionUsageDaily" DROP CONSTRAINT "CompanySubscriptionUsageDaily_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanySubscriptionUsageMonthly" DROP CONSTRAINT "CompanySubscriptionUsageMonthly_companyId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_companyId_fkey";

-- DropForeignKey
ALTER TABLE "SubscriptionUpgradeRequest" DROP CONSTRAINT "SubscriptionUpgradeRequest_companyId_fkey";

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEmployeeAttendance" ADD CONSTRAINT "PayrollEmployeeAttendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscriptionUsageDaily" ADD CONSTRAINT "CompanySubscriptionUsageDaily_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscriptionUsageMonthly" ADD CONSTRAINT "CompanySubscriptionUsageMonthly_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionUpgradeRequest" ADD CONSTRAINT "SubscriptionUpgradeRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
