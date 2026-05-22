/*
  Warnings:

  - You are about to drop the column `customerTotal` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `ProposalLineItem` table. All the data in the column will be lost.
  - Added the required column `addressLine1` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zip` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `ProposalLineItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProposalStage" AS ENUM ('LEAD_STAGE', 'OFFICE_VISIT', 'FORMAL_ANALYSIS', 'PRE_PERMIT', 'PRE_CONSTRUCTION');

-- CreateEnum
CREATE TYPE "LeadChannel" AS ENUM ('WEBSITE', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'YOUTUBE', 'GOOGLE', 'OPEN_HOUSE', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AduType" AS ENUM ('ATTACHED', 'DETACHED');

-- CreateEnum
CREATE TYPE "LineItemKind" AS ENUM ('SITE_WORK', 'UPGRADE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENT', 'PROMO');

-- CreateEnum
CREATE TYPE "ProposalEventType" AS ENUM ('CREATED', 'UPDATED', 'SUBMITTED', 'PDF_GENERATION_STARTED', 'PDF_GENERATED', 'SENT', 'VIEWED', 'SIGNED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkItemKind" AS ENUM ('SITE_WORK', 'UPGRADE');

-- DropForeignKey
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_formalAnalysisId_fkey";

-- DropForeignKey
ALTER TABLE "ProposalLineItem" DROP CONSTRAINT "ProposalLineItem_workItemId_fkey";

-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "customerTotal",
ADD COLUMN     "addressLine1" TEXT NOT NULL,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "channel" "LeadChannel",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "county" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "pdfStatus" TEXT,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "pricingVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "snapshotJson" JSONB,
ADD COLUMN     "snapshotVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "stage" "ProposalStage",
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "totalDiscounts" INTEGER,
ADD COLUMN     "totalPrice" INTEGER,
ADD COLUMN     "totalSiteWork" INTEGER,
ADD COLUMN     "totalUpgrades" INTEGER,
ADD COLUMN     "zip" TEXT NOT NULL,
ALTER COLUMN "formalAnalysisId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProposalLineItem" DROP COLUMN "totalPrice",
ADD COLUMN     "appliesTo" JSONB,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "computedPrice" INTEGER,
ADD COLUMN     "finalPrice" INTEGER,
ADD COLUMN     "kind" "LineItemKind" NOT NULL DEFAULT 'SITE_WORK',
ADD COLUMN     "markupType" "MarkupType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "markupValue" DOUBLE PRECISION,
ADD COLUMN     "overridePrice" INTEGER,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "workItemId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkItem" ADD COLUMN     "kind" "WorkItemKind" NOT NULL DEFAULT 'SITE_WORK';

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalFloorplanSelection" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "aduType" "AduType" NOT NULL,
    "floorplanRef" TEXT NOT NULL,
    "name" TEXT,
    "sqft" INTEGER,
    "bed" INTEGER,
    "bath" INTEGER,
    "basePrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalFloorplanSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalDiscount" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountRef" TEXT,
    "name" TEXT,
    "amountOff" INTEGER,
    "percentOff" DOUBLE PRECISION,
    "appliesTo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalComputedOutput" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "rentEstimateMonthly" INTEGER,
    "paymentEstimateMonthly" INTEGER,
    "cashflowMonthly" INTEGER,
    "roiYear1" DOUBLE PRECISION,
    "roiYear5" DOUBLE PRECISION,
    "roiYear10" DOUBLE PRECISION,
    "equityBoostYear1" INTEGER,
    "equityBoostYear5" INTEGER,
    "equityBoostYear10" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalComputedOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalEvent" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "type" "ProposalEventType" NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalUpload" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_organizationId_userId_key" ON "Membership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "ProposalFloorplanSelection_proposalId_idx" ON "ProposalFloorplanSelection"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalFloorplanSelection_floorplanRef_aduType_idx" ON "ProposalFloorplanSelection"("floorplanRef", "aduType");

-- CreateIndex
CREATE INDEX "ProposalFloorplanSelection_sqft_idx" ON "ProposalFloorplanSelection"("sqft");

-- CreateIndex
CREATE INDEX "ProposalDiscount_proposalId_idx" ON "ProposalDiscount"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalDiscount_discountRef_idx" ON "ProposalDiscount"("discountRef");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalComputedOutput_proposalId_key" ON "ProposalComputedOutput"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalComputedOutput_rentEstimateMonthly_idx" ON "ProposalComputedOutput"("rentEstimateMonthly");

-- CreateIndex
CREATE INDEX "ProposalComputedOutput_cashflowMonthly_idx" ON "ProposalComputedOutput"("cashflowMonthly");

-- CreateIndex
CREATE INDEX "ProposalEvent_proposalId_createdAt_idx" ON "ProposalEvent"("proposalId", "createdAt");

-- CreateIndex
CREATE INDEX "ProposalEvent_type_createdAt_idx" ON "ProposalEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ProposalUpload_proposalId_idx" ON "ProposalUpload"("proposalId");

-- CreateIndex
CREATE INDEX "Proposal_organizationId_createdAt_idx" ON "Proposal"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_status_createdAt_idx" ON "Proposal"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_city_zip_idx" ON "Proposal"("city", "zip");

-- CreateIndex
CREATE INDEX "Proposal_createdById_createdAt_idx" ON "Proposal"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_assignedToId_status_idx" ON "Proposal"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "Proposal_totalPrice_idx" ON "Proposal"("totalPrice");

-- CreateIndex
CREATE INDEX "ProposalLineItem_workItemId_kind_idx" ON "ProposalLineItem"("workItemId", "kind");

-- CreateIndex
CREATE INDEX "ProposalLineItem_category_idx" ON "ProposalLineItem"("category");

-- CreateIndex
CREATE INDEX "WorkItem_kind_status_idx" ON "WorkItem"("kind", "status");

-- CreateIndex
CREATE INDEX "WorkItem_categoryId_kind_idx" ON "WorkItem"("categoryId", "kind");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_formalAnalysisId_fkey" FOREIGN KEY ("formalAnalysisId") REFERENCES "FormalAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalFloorplanSelection" ADD CONSTRAINT "ProposalFloorplanSelection_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalLineItem" ADD CONSTRAINT "ProposalLineItem_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalDiscount" ADD CONSTRAINT "ProposalDiscount_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalComputedOutput" ADD CONSTRAINT "ProposalComputedOutput_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalEvent" ADD CONSTRAINT "ProposalEvent_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalEvent" ADD CONSTRAINT "ProposalEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalUpload" ADD CONSTRAINT "ProposalUpload_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
