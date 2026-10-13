CREATE INDEX IF NOT EXISTS idx_rooms_host_user_id ON rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_items_room_id ON items(room_id);
CREATE INDEX IF NOT EXISTS idx_room_events_room_id ON room_events(room_id);
CREATE INDEX IF NOT EXISTS idx_tips_room_id ON tips(room_id);

