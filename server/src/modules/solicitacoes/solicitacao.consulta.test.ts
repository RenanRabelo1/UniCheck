import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { start } from "../../testing/testApp.js";
let context: Awaited<ReturnType<typeof start>>;
beforeEach(async () => {
  context = await start("2026-10-05T12:00:00-03:00");
});
afterEach(() => {
  vi.useRealTimers();
  delete process.env.DATA_FILE;
});
describe("consulta das duas telas", () => {
  it("lista exclusivamente os pedidos do usuário e fornece semestre e protocolo", async () => {
    for (const [token, ids] of [
      [context.professor, ["sol-001", "sol-002", "sol-003", "sol-004"]],
      [context.aluno, ["sol-005", "sol-006", "sol-007"]],
    ] as const) {
      const res = await request(context.app)
        .get("/solicitacoes")
        .set("Authorization", token);
      expect(res.status).toBe(200);
      expect(res.body.map((s: { id: string }) => s.id).sort()).toEqual([
        ...ids,
      ]);
      expect(res.body[0]).toMatchObject({
        semester: "2026.2",
        protocol: res.body[0].id,
      });
      expect(res.body[0].items[0].updatedAt).toBeTruthy();
    }
  });
  it("detalhes contêm movimentações reais do pedido, sem dados secretos", async () => {
    const res = await request(context.app)
      .get("/solicitacoes/sol-004")
      .set("Authorization", context.professor);
    expect(res.status).toBe(200);
    expect(res.body.requester.name).toBe("Prof. Ricardo Mendes");
    expect(res.body.movements.map((m: { id: string }) => m.id)).toEqual([
      "mov-001",
      "mov-002",
    ]);
    expect(res.body.movements[1]).toMatchObject({
      registeredAt: "2026-10-02T17:45:00-03:00",
      type: "DEVOLUCAO",
    });
    expect(res.body.movements[0].attendant).not.toBe("Não informado");
    expect(JSON.stringify(res.body)).not.toMatch(/senhaHash|jwtSecret/);
  });
  it("não revela pedido alheio nem inexistente e exige login nas duas rotas", async () => {
    for (const id of ["sol-004", "nao-existe"]) {
      const res = await request(context.app)
        .get(`/solicitacoes/${id}`)
        .set("Authorization", context.aluno);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Solicitação não encontrada.");
    }
    for (const path of ["/solicitacoes", "/solicitacoes/sol-004"])
      expect((await request(context.app).get(path)).status).toBe(401);
  });
});
