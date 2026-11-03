import { z } from "zod";
import {
  getJson,
  parseResponse,
  patchJson,
  postJson,
  sessionToken,
} from "./api";

const roomSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
});
const keySchema = z.object({
  id: z.string(),
  room: z.object({ value: z.string(), label: z.string() }),
  type: z.enum(["primary", "secondary"]),
  typeLabel: z.string(),
  active: z.boolean(),
  inPossession: z.boolean(),
});
export type Room = z.infer<typeof roomSchema>;
export type RoomKey = z.infer<typeof keySchema>;
export type RoomsAndKeys = { rooms: Room[]; keys: RoomKey[] };

export async function listRoomsAndKeys(
  signal?: AbortSignal,
): Promise<RoomsAndKeys> {
  const [rooms, keys] = await Promise.all([
    getJson("/admin/salas", sessionToken(), signal),
    getJson("/admin/chaves", sessionToken(), signal),
  ]);
  return {
    rooms: parseResponse(z.array(roomSchema), rooms),
    keys: parseResponse(z.array(keySchema), keys),
  };
}

export async function listKeys(signal?: AbortSignal): Promise<RoomKey[]> {
  return parseResponse(
    z.array(keySchema),
    await getJson("/admin/chaves", sessionToken(), signal),
  );
}

export async function createRoom(input: {
  code: string;
  name: string;
}): Promise<Room> {
  return parseResponse(
    roomSchema,
    await postJson("/admin/salas", input, sessionToken()),
  );
}

export async function updateRoom(
  id: string,
  input: { code?: string; name?: string; active?: boolean },
): Promise<Room> {
  return parseResponse(
    roomSchema,
    await patchJson(`/admin/salas/${id}`, input, sessionToken()),
  );
}

export async function createKey(input: {
  roomId: string;
  type: RoomKey["type"];
}): Promise<RoomKey> {
  return parseResponse(
    keySchema,
    await postJson("/admin/chaves", input, sessionToken()),
  );
}

export async function setKeyActive(
  id: string,
  active: boolean,
): Promise<RoomKey> {
  return parseResponse(
    keySchema,
    await patchJson(`/admin/chaves/${id}`, { active }, sessionToken()),
  );
}
