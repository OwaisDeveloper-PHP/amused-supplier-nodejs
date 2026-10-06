-- AlterTable
ALTER TABLE "sell_with_us_submissions" ADD COLUMN     "additional_info" TEXT,
ADD COLUMN     "preference" TEXT,
ADD COLUMN     "repairs" TEXT,
ADD COLUMN     "visible_wear" JSONB,
ADD COLUMN     "where_purchased" TEXT;
