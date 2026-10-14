-- 0003_room_group_photo.sql
-- Menambahkan kolom group_photo_url untuk menyimpan foto barengan/kenangan di room

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS group_photo_url TEXT;

