export type RoomStatus = "DRAFT" | "CLAIMING" | "LOCKED" | "CLOSED";

export interface ItemClaimPortion {
  member_id: string;
  portion_quantity: number;
}

export interface RoomReceipt {
  id: string;
  title: string;
  payer_member_id: string | null;
  payer_name: string;
  subtotal: number;
  tax_amount: number;
  service_amount: number;
  discount_amount: number;
  grand_total: number;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  qris_image_url?: string | null;
  receipt_image_url?: string | null;
  created_by_member_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface ReceiptBreakdownItem {
  receipt_id: string;
  title: string;
  payer_member_id: string | null;
  payer_name: string;
  amount: number;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  qris_image_url?: string | null;
}

export interface RoomItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  is_shared: boolean;
  receipt_id?: string | null;
  claimed_quantity: number;
  claimed_by_member_ids: string[];
  claims?: ItemClaimPortion[];
}

export interface RoomMember {
  id: string;
  user_id?: string | null;
  display_name: string;
  avatar_url?: string | null;
  is_host: boolean;
  subtotal_share: number;
  raw_share_amount?: number;
  share_amount: number;
  receipt_breakdown?: ReceiptBreakdownItem[];
  claimed_item_ids: string[];
  payment_status?: "UNPAID" | "PENDING" | "VERIFIED" | "REJECTED";
  proof_image_url?: string | null;
  rejection_reason?: string | null;
}

export interface RoomDetail {
  room_code: string;
  title: string;
  status: RoomStatus;
  host_user_id?: string | null;
  subtotal: number;
  tax_amount: number;
  service_amount: number;
  discount_amount: number;
  grand_total: number;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  qris_image_url?: string | null;
  receipt_image_url?: string | null;
  group_photo_url?: string | null;
  round_mode?: string | null;
  receipts?: RoomReceipt[];
  items: RoomItem[];
  members: RoomMember[];
}

export interface JoinResult {
  member_id: string;
  display_name: string;
  is_host: boolean;
  room_status: RoomStatus;
}

export interface RoomEvent {
  id: string;
  member_id: string | null;
  display_name: string | null;
  event_type: string;
  sender_type: "SYSTEM" | "MEMBER";
  message: string;
  created_at: string;
}
