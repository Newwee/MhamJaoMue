import { RoomSummary } from '../types/common';

const REGISTRY_TOPIC = 'mham_casino_rooms_v2';
const REGISTRY_URL = `https://ntfy.sh/${REGISTRY_TOPIC}`;

export async function announceRoom(room: RoomSummary): Promise<void> {
  try {
    await fetch(REGISTRY_URL, {
      method: 'POST',
      headers: {
        'Title': 'Room Announcement',
        'Priority': 'low',
      },
      body: JSON.stringify({
        type: 'room_alive',
        room,
        timestamp: Date.now(),
      }),
    });
  } catch {}
}

export async function fetchPublicRooms(): Promise<RoomSummary[]> {
  try {
    const res = await fetch(`${REGISTRY_URL}/json?poll=1&since=10m`);
    if (!res.ok) return [];

    const text = await res.text();
    const lines = text.trim().split('\n');
    const roomsMap = new Map<string, { room: RoomSummary; timestamp: number }>();

    for (const line of lines) {
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message) {
          const payload = JSON.parse(parsed.message);
          if (payload.type === 'room_alive' && payload.room && payload.room.id) {
            roomsMap.set(payload.room.id, {
              room: payload.room,
              timestamp: payload.timestamp || parsed.time * 1000,
            });
          }
        }
      } catch {}
    }

    const now = Date.now();
    const activeRooms: RoomSummary[] = [];

    for (const [_, entry] of roomsMap.entries()) {
      if (now - entry.timestamp < 10 * 60 * 1000) {
        activeRooms.push(entry.room);
      }
    }

    return activeRooms;
  } catch {
    return [];
  }
}
