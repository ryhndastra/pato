export type RoomStatus = "DRAFT" | "CLAIMING" | "LOCKED" | "CLOSED";

export interface RoomItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  is_shared: boolean;
}

export interface RoomDetail {
  room_code: string;
  title: string;
  status: RoomStatus;
  subtotal: number;
  tax_amount: number;
  service_amount: number;
  discount_amount: number;
  grand_total: number;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  items: RoomItem[];
}

export interface JoinResult {
  member_id: string;
  display_name: string;
  is_host: boolean;
  room_status: RoomStatus;
}
