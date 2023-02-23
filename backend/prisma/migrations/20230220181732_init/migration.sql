-- CreateTable
CREATE TABLE "Offer" (
    "id" BLOB NOT NULL PRIMARY KEY,
    "offer" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "found_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "info" TEXT NOT NULL,
    "info_version" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "CatInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "mojos_per_coin" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "nftInfo" (
    "launcher_id" TEXT NOT NULL PRIMARY KEY,
    "coin_id" TEXT,
    "info" TEXT,
    "info_version" INTEGER NOT NULL,
    "minter_did_id" TEXT,
    "collection_id" TEXT,
    "col_id" TEXT
);

-- CreateTable
CREATE TABLE "OfferComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requested" BOOLEAN NOT NULL,
    "offer_id" BLOB NOT NULL,
    "component_id" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "requested_component_id" ON "OfferComponent"("requested", "component_id");

-- CreateIndex
CREATE INDEX "component_id" ON "OfferComponent"("component_id");

-- CreateIndex
CREATE INDEX "offer_id" ON "OfferComponent"("offer_id");
