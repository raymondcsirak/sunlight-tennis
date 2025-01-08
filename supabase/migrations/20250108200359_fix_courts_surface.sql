-- Step 1: Add the surface column as nullable first
ALTER TABLE "public"."courts" ADD COLUMN IF NOT EXISTS "surface" surface_type;

-- Step 2: Update existing rows with a default value (clay is most common in Romania)
UPDATE "public"."courts" SET "surface" = 'clay' WHERE "surface" IS NULL;

-- Step 3: Make the column non-nullable
ALTER TABLE "public"."courts" ALTER COLUMN "surface" SET NOT NULL;
