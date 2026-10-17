-- 0004_payout_and_rounding.sql
-- Menambahkan kolom default payout & preferensi pembulatan ke tabel users, serta round_mode ke tabel rooms

ALTER TABLE users ADD COLUMN IF NOT EXISTS default_bank_name VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_bank_account_no VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_bank_account_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_round_mode VARCHAR(20) DEFAULT 'hundred';

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS round_mode VARCHAR(20) DEFAULT 'hundred';
