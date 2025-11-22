-- Удаляем записи с NULL userQuery (если есть)
DELETE FROM "Domain" WHERE "userQuery" IS NULL;

-- Изменяем колонку userQuery на NOT NULL
ALTER TABLE "Domain" ALTER COLUMN "userQuery" SET NOT NULL;

