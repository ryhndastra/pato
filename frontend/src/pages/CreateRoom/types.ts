export interface DraftItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateRoomResponse {
  room_code: string;
  share_url: string;
  host_token: string;
}

export type BankPreset = {
  id: string;
  name: string;
  category: "bank" | "ewallet";
  color: string;
};
