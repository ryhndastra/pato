# 🗄️ 04. Database Schema & Golang Domain Models
**PaTo (Pay Together) — PostgreSQL DDL & Go Struct Architecture**

---

## 1. PostgreSQL Schema DDL (`migrations/000001_init_schema.up.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE room_status AS ENUM ('DRAFT', 'CLAIMING', 'LOCKED', 'CLOSED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'REJECTED', 'VERIFIED');
CREATE TYPE sender_type AS ENUM ('SYSTEM', 'MEMBER');

-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    auth_provider VARCHAR(50) DEFAULT 'local',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ROOMS
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    room_code VARCHAR(12) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    status room_status NOT NULL DEFAULT 'DRAFT',
    
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    service_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    service_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,

    receipt_image_url TEXT,
    qris_image_url TEXT,
    bank_name VARCHAR(50),
    bank_account_no VARCHAR(50),
    bank_account_name VARCHAR(100),

    locked_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    media_purged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_rooms_status ON rooms(status);

-- MEMBERS
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_token VARCHAR(64) NOT NULL,
    display_name VARCHAR(60) NOT NULL,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_color VARCHAR(16) DEFAULT '#4477bb',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_room_guest_token UNIQUE (room_id, guest_token)
);

CREATE INDEX idx_members_room ON members(room_id);

-- ITEMS
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ITEM_CLAIMS
CREATE TABLE item_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    portion_quantity NUMERIC(6, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_item_member UNIQUE (item_id, member_id)
);

-- PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    calculated_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    proof_image_url TEXT,
    status payment_status NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_room_member_payment UNIQUE (room_id, member_id)
);

-- ROOM_EVENTS
CREATE TABLE room_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    sender_type sender_type NOT NULL DEFAULT 'SYSTEM',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TIPS & DONATIONS
CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    donation_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2. Golang Domain Models (`backend/internal/domain/models.go`)

```go
package domain

import (
	"time"
	"github.com/google/uuid"
)

type RoomStatus string
const (
	RoomStatusDraft    RoomStatus = "DRAFT"
	RoomStatusClaiming RoomStatus = "CLAIMING"
	RoomStatusLocked   RoomStatus = "LOCKED"
	RoomStatusClosed   RoomStatus = "CLOSED"
)

type PaymentStatus string
const (
	PaymentStatusPending  PaymentStatus = "PENDING"
	PaymentStatusRejected PaymentStatus = "REJECTED"
	PaymentStatusVerified PaymentStatus = "VERIFIED"
)

type Room struct {
	ID                 uuid.UUID  `json:"id" db:"id"`
	HostUserID         *uuid.UUID `json:"host_user_id,omitempty" db:"host_user_id"`
	RoomCode           string     `json:"room_code" db:"room_code"`
	Title              string     `json:"title" db:"title"`
	Status             RoomStatus `json:"status" db:"status"`
	Subtotal           float64    `json:"subtotal" db:"subtotal"`
	TaxRatePercent     float64    `json:"tax_rate_percent" db:"tax_rate_percent"`
	TaxAmount          float64    `json:"tax_amount" db:"tax_amount"`
	ServiceRatePercent float64    `json:"service_rate_percent" db:"service_rate_percent"`
	ServiceAmount      float64    `json:"service_amount" db:"service_amount"`
	DiscountAmount     float64    `json:"discount_amount" db:"discount_amount"`
	GrandTotal         float64    `json:"grand_total" db:"grand_total"`
	ReceiptImageURL    *string    `json:"receipt_image_url,omitempty" db:"receipt_image_url"`
	QRISImageURL       *string    `json:"qris_image_url,omitempty" db:"qris_image_url"`
	BankName           *string    `json:"bank_name,omitempty" db:"bank_name"`
	BankAccountNo      *string    `json:"bank_account_no,omitempty" db:"bank_account_no"`
	BankAccountName    *string    `json:"bank_account_name,omitempty" db:"bank_account_name"`
	LockedAt           *time.Time `json:"locked_at,omitempty" db:"locked_at"`
	ClosedAt           *time.Time `json:"closed_at,omitempty" db:"closed_at"`
	MediaPurgedAt      *time.Time `json:"media_purged_at,omitempty" db:"media_purged_at"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`

	Members []Member `json:"members,omitempty" db:"-"`
	Items   []Item   `json:"items,omitempty" db:"-"`
}

type Member struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	RoomID      uuid.UUID  `json:"room_id" db:"room_id"`
	UserID      *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	GuestToken  string     `json:"-" db:"guest_token"`
	DisplayName string     `json:"display_name" db:"display_name"`
	IsHost      bool       `json:"is_host" db:"is_host"`
	AvatarColor string     `json:"avatar_color" db:"avatar_color"`
	JoinedAt    time.Time  `json:"joined_at" db:"joined_at"`
}

type Item struct {
	ID        uuid.UUID   `json:"id" db:"id"`
	RoomID    uuid.UUID   `json:"room_id" db:"room_id"`
	Name      string      `json:"name" db:"name"`
	UnitPrice float64     `json:"unit_price" db:"unit_price"`
	Quantity  int         `json:"quantity" db:"quantity"`
	IsShared  bool        `json:"is_shared" db:"is_shared"`
	SortOrder int         `json:"sort_order" db:"sort_order"`
	CreatedAt time.Time   `json:"created_at" db:"created_at"`
	Claims    []ItemClaim `json:"claims,omitempty" db:"-"`
}

type ItemClaim struct {
	ID              uuid.UUID `json:"id" db:"id"`
	ItemID          uuid.UUID `json:"item_id" db:"item_id"`
	MemberID        uuid.UUID `json:"member_id" db:"member_id"`
	PortionQuantity float64   `json:"portion_quantity" db:"portion_quantity"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

type Payment struct {
	ID               uuid.UUID     `json:"id" db:"id"`
	RoomID           uuid.UUID     `json:"room_id" db:"room_id"`
	MemberID         uuid.UUID     `json:"member_id" db:"member_id"`
	CalculatedAmount float64       `json:"calculated_amount" db:"calculated_amount"`
	PaidAmount       float64       `json:"paid_amount" db:"paid_amount"`
	ProofImageURL    *string       `json:"proof_image_url,omitempty" db:"proof_image_url"`
	Status           PaymentStatus `json:"status" db:"status"`
	RejectionReason  *string       `json:"rejection_reason,omitempty" db:"rejection_reason"`
	SubmittedAt      *time.Time    `json:"submitted_at,omitempty" db:"submitted_at"`
	VerifiedAt       *time.Time    `json:"verified_at,omitempty" db:"verified_at"`
	CreatedAt        time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at" db:"updated_at"`
}
```

---

## 3. Golang Fair-Math Service (`backend/internal/service/calculator.go`)

```go
package service

import "math"

type MemberBillResult struct {
	MemberID             string  `json:"member_id"`
	ItemsSubtotal        float64 `json:"items_subtotal"`
	TaxProportional      float64 `json:"tax_proportional"`
	ServiceProportional  float64 `json:"service_proportional"`
	DiscountProportional float64 `json:"discount_proportional"`
	GrandTotal           float64 `json:"grand_total"`
}

func CalculateProportionalBill(
	memberSubtotals map[string]float64,
	totalFoodSubtotal float64,
	totalTax float64,
	totalService float64,
	totalDiscount float64,
) map[string]MemberBillResult {
	results := make(map[string]MemberBillResult)
	if totalFoodSubtotal <= 0 {
		return results
	}

	for memberID, subtotal := range memberSubtotals {
		ratio := subtotal / totalFoodSubtotal

		tax := math.Round(totalTax * ratio)
		service := math.Round(totalService * ratio)
		discount := math.Round(totalDiscount * ratio)

		grandTotal := subtotal + tax + service - discount
		if grandTotal < 0 {
			grandTotal = 0
		}

		results[memberID] = MemberBillResult{
			MemberID:             memberID,
			ItemsSubtotal:        subtotal,
			TaxProportional:      tax,
			ServiceProportional:  service,
			DiscountProportional: discount,
			GrandTotal:           grandTotal,
		}
	}

	return results
}
```
