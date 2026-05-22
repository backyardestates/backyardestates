-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ARCHITECT', 'ADMIN');

-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "CalcMethod" AS ENUM ('LINEAR_FT', 'SQ_FT', 'QUANTITY', 'MANUAL', 'ALLOWANCE', 'UNIT_RATE');

-- CreateEnum
CREATE TYPE "MarkupType" AS ENUM ('PERCENT', 'FIXED', 'TIERED', 'NONE');

-- CreateEnum
CREATE TYPE "ImpactArea" AS ENUM ('PLANS', 'PERMITTING', 'CONSTRUCTION', 'TIMELINE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FeasibilityAnswerValue" AS ENUM ('YES', 'NO', 'UNSURE');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'REVIEWED', 'SENT', 'SIGNED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssessStage" AS ENUM ('LEAD_STAGE', 'OFFICE_VISIT', 'FORMAL_ANALYSIS', 'PRE_PERMIT', 'PRE_CONSTRUCTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "description" TEXT,
    "whyItMatters" TEXT,
    "status" "WorkStatus" NOT NULL DEFAULT 'ACTIVE',
    "categoryId" TEXT NOT NULL,
    "typicalMin" INTEGER,
    "typicalMax" INTEGER,
    "internalMin" INTEGER,
    "internalMax" INTEGER,
    "affectsPlans" BOOLEAN NOT NULL DEFAULT false,
    "affectsPermitting" BOOLEAN NOT NULL DEFAULT false,
    "affectsConstruction" BOOLEAN NOT NULL DEFAULT false,
    "assessmentSummary" TEXT,
    "avoidanceSummary" TEXT,
    "confidenceScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingModel" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "calcMethod" "CalcMethod" NOT NULL,
    "unitLabel" TEXT,
    "baseInternal" INTEGER,
    "baseCustomer" INTEGER,
    "internalUnit" INTEGER,
    "customerUnit" INTEGER,
    "markupType" "MarkupType" NOT NULL DEFAULT 'NONE',
    "markupValue" DOUBLE PRECISION,
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PricingModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactDetail" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "area" "ImpactArea" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "detail" TEXT,
    "durationMinDays" INTEGER,
    "durationMaxDays" INTEGER,

    CONSTRAINT "ImpactDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerRule" (
    "id" TEXT NOT NULL,
    "sourceWorkItemId" TEXT NOT NULL,
    "triggeredWorkItemId" TEXT NOT NULL,
    "condition" TEXT,
    "probability" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "TriggerRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeasibilityReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "aduType" TEXT,
    "timeframe" TEXT,
    "priority" TEXT,
    "motivation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeasibilityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeasibilityAnswer" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "answer" "FeasibilityAnswerValue" NOT NULL,
    "shownMin" INTEGER,
    "shownMax" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeasibilityAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormalAnalysis" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "architectId" TEXT,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormalAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormalAnswer" (
    "id" TEXT NOT NULL,
    "formalAnalysisId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "valueJson" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormalAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" TEXT NOT NULL,
    "formalAnalysisId" TEXT NOT NULL,
    "workItemId" TEXT,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "formalAnalysisId" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "customerTotal" INTEGER,
    "internalTotal" INTEGER,
    "profit" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalLineItem" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unitLabel" TEXT,
    "unitPrice" INTEGER,
    "totalPrice" INTEGER,
    "internalCost" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkItem_slug_key" ON "WorkItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FeasibilityAnswer_reportId_workItemId_key" ON "FeasibilityAnswer"("reportId", "workItemId");

-- CreateIndex
CREATE UNIQUE INDEX "FormalAnswer_formalAnalysisId_workItemId_key" ON "FormalAnswer"("formalAnalysisId", "workItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_formalAnalysisId_key" ON "Proposal"("formalAnalysisId");

-- CreateIndex
CREATE INDEX "ProposalLineItem_proposalId_idx" ON "ProposalLineItem"("proposalId");

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingModel" ADD CONSTRAINT "PricingModel_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactDetail" ADD CONSTRAINT "ImpactDetail_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerRule" ADD CONSTRAINT "TriggerRule_sourceWorkItemId_fkey" FOREIGN KEY ("sourceWorkItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerRule" ADD CONSTRAINT "TriggerRule_triggeredWorkItemId_fkey" FOREIGN KEY ("triggeredWorkItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeasibilityReport" ADD CONSTRAINT "FeasibilityReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeasibilityAnswer" ADD CONSTRAINT "FeasibilityAnswer_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FeasibilityReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeasibilityAnswer" ADD CONSTRAINT "FeasibilityAnswer_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormalAnalysis" ADD CONSTRAINT "FormalAnalysis_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FeasibilityReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormalAnalysis" ADD CONSTRAINT "FormalAnalysis_architectId_fkey" FOREIGN KEY ("architectId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormalAnswer" ADD CONSTRAINT "FormalAnswer_formalAnalysisId_fkey" FOREIGN KEY ("formalAnalysisId") REFERENCES "FormalAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormalAnswer" ADD CONSTRAINT "FormalAnswer_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_formalAnalysisId_fkey" FOREIGN KEY ("formalAnalysisId") REFERENCES "FormalAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_formalAnalysisId_fkey" FOREIGN KEY ("formalAnalysisId") REFERENCES "FormalAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalLineItem" ADD CONSTRAINT "ProposalLineItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalLineItem" ADD CONSTRAINT "ProposalLineItem_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
