-- CreateTable
CREATE TABLE "Gym" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "treasury" TEXT NOT NULL,
    "royaltyBps" INTEGER NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipCache" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "gymAddress" TEXT NOT NULL,
    "tierId" INTEGER NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadataUri" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryEvent" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "gymAddress" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "walletAddress" TEXT NOT NULL,

    CONSTRAINT "EntryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gym_address_key" ON "Gym"("address");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipCache_tokenId_key" ON "MembershipCache"("tokenId");

-- CreateIndex
CREATE INDEX "MembershipCache_gymAddress_idx" ON "MembershipCache"("gymAddress");

-- CreateIndex
CREATE INDEX "MembershipCache_ownerAddress_idx" ON "MembershipCache"("ownerAddress");

-- CreateIndex
CREATE INDEX "EntryEvent_tokenId_idx" ON "EntryEvent"("tokenId");

-- CreateIndex
CREATE INDEX "EntryEvent_gymAddress_idx" ON "EntryEvent"("gymAddress");

-- CreateIndex
CREATE INDEX "EntryEvent_walletAddress_idx" ON "EntryEvent"("walletAddress");
