-- Pas 1: Adaugare coloane surface ca nullable
ALTER TABLE "public"."courts" ADD COLUMN IF NOT EXISTS "surface" surface_type;

-- Pas 2: Actualizare randuri existente cu valoare default (argila este cea mai comuna in Romania)
UPDATE "public"."courts" SET "surface" = 'clay' WHERE "surface" IS NULL;

-- Pas 3: Coloana non-nullable
ALTER TABLE "public"."courts" ALTER COLUMN "surface" SET NOT NULL;
