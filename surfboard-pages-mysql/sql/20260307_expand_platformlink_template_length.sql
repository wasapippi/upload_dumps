-- Expand PlatformLink template columns to handle long encoded URLs.
-- MySQL 8.3.0
USE surfboard;

ALTER TABLE PlatformLink
  MODIFY COLUMN urlTemplate TEXT NOT NULL,
  MODIFY COLUMN commentTemplate TEXT NULL;
