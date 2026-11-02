import { z } from "zod";
import {
  getJson,
  parseResponse,
  patchJson,
  postJson,
  sessionToken,
} from "./api";

const materialSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  control: z.enum(["individual", "quantity"]),
  patrimony: z.string().nullable(),
  detail: z.string().nullable(),
  totalQuantity: z.number(),
  committed: z.number(),
  inPossession: z.number(),
  active: z.boolean(),
});
export type Material = z.infer<typeof materialSchema>;
export type MaterialInput = {
  name: string;
  category: string;
  control: Material["control"];
  patrimony?: string;
  detail?: string;
  totalQuantity: number;
};
export type MaterialPatch = Partial<Omit<MaterialInput, "control">> & {
  active?: boolean;
};

export async function listMaterials(signal?: AbortSignal): Promise<Material[]> {
  return parseResponse(
    z.array(materialSchema),
    await getJson("/admin/materiais", sessionToken(), signal),
  );
}

export async function createMaterial(input: MaterialInput): Promise<Material> {
  return parseResponse(
    materialSchema,
    await postJson("/admin/materiais", input, sessionToken()),
  );
}

export async function updateMaterial(
  id: string,
  input: MaterialPatch,
): Promise<Material> {
  return parseResponse(
    materialSchema,
    await patchJson(`/admin/materiais/${id}`, input, sessionToken()),
  );
}
