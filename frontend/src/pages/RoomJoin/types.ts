export type RoomStatus = "DRAFT" | "CLAIMING" | "LOCKED" | "CLOSED";

export interface ItemClaimPortion {
  member_id: string;
  portion_quantity: number;
}

export interface RoomItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  is_shared: boolean;
  claimed_quantity: number;
  claimed_by_member_ids: string[];
  claims?: ItemClaimPortion[];
}

export interface RoomMember {
  id: string;
  user_id?: string | null;
  display_name: string;
  is_host: boolean;
  subtotal_share: number;
  share_amount: number;
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
