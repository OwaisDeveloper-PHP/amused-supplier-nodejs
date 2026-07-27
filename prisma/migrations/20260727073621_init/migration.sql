-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "remember_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "country_code" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "iban" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'shopify',
    "api_base_url" TEXT,
    "api_endpoint" TEXT,
    "api_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "products_synced" INTEGER NOT NULL DEFAULT 0,
    "last_synced_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sell_with_us_submissions" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "condition" TEXT,
    "inclusions" TEXT,
    "model" TEXT,
    "colour" TEXT,
    "size" TEXT,
    "material" TEXT,
    "year_purchased" TEXT,
    "notes" TEXT,
    "minimum_price" DECIMAL(12,2),
    "photos" JSONB,
    "extra_photos" JSONB,
    "walkthrough_video" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "country_code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "iban" TEXT,
    "referral_source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "supplier_id" INTEGER,
    "admin_notes" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "email_sent_at" TIMESTAMP(3),
    "pushed_to_shopify_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sell_with_us_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "from_name" TEXT,
    "from_email" TEXT,
    "sendgrid_template_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sell_with_us_submissions_reference_key" ON "sell_with_us_submissions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_key_key" ON "email_templates"("key");

-- AddForeignKey
ALTER TABLE "sell_with_us_submissions" ADD CONSTRAINT "sell_with_us_submissions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
