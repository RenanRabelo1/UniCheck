import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { start } from "../../testing/testApp.js";
let context: Awaited<ReturnType<typeof start>>;
beforeEach(async () => {
  context = await start("2026-10-05T12:00:00-03:00");
});
afterEach(() => {
  vi.useRealTimers();
});
describe("consulta das duas telas", () => {
  it("lista exclusivamente os pedidos do usuário e fornece semestre e protocolo", async () => {
    for (const [token, ids] of [
      [context.professor, ["1001", "1002", "1003", "1004"]],
      [context.aluno, ["1005", "1006", "1007"]],
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
        protocol: expect.stringMatching(/^CCT-2026-\d{5}$/),
      });
      expect(res.body[0].items[0].updatedAt).toBeTruthy();
    }
  });
  it("detalhes contêm movimentações reais do pedido, sem dados secretos", async () => {
    const res = await request(context.app)
      .get("/solicitacoes/1004")
      .set("Authorization", context.professor);
    expect(res.status).toBe(200);
    expect(res.body.requester.name).toBe("Prof. Ricardo Mendes");
    expect(res.body.movements.map((m: { id: string }) => m.id)).toEqual([
      "1001",
      "1002",
    ]);
    expect(res.body.movements[1]).toMatchObject({
      registeredAt: "2026-10-02T17:45:00-03:00",
      type: "DEVOLUCAO",
    });
    expect(res.body.movements[0].attendant).not.toBe("Não informado");
    expect(JSON.stringify(res.body)).not.toMatch(/senhaHash|jwtSecret/);
  });
  it("não revela pedido alheio nem inexistente e exige login nas duas rotas", async () => {
    for (const id of ["1004", "nao-existe"]) {
      const res = await request(context.app)
        .get(`/solicitacoes/${id}`)
        .set("Authorization", context.aluno);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Solicitação não encontrada.");
    }
    for (const path of ["/solicitacoes", "/solicitacoes/1004"])
      expect((await request(context.app).get(path)).status).toBe(401);
  });
});
