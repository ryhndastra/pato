-- 0005_multi_receipts.sql
-- Mendukung Multi-Struk / Multi-Tempat dalam satu Room (misal Resto + Cafe)
-- dengan Payer & Rekening/QRIS masing-masing untuk setiap struk.

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    payer_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    payer_name VARCHAR(100),
    title VARCHAR(150) NOT NULL,
    receipt_image_url TEXT,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    service_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    bank_name VARCHAR(50),
    bank_account_no VARCHAR(50),
    bank_account_name VARCHAR(100),
    qris_image_url TEXT,
    created_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_room ON receipts(room_id);

ALTER TABLE items ADD COLUMN IF NOT EXISTS receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_items_receipt ON items(receipt_id);
