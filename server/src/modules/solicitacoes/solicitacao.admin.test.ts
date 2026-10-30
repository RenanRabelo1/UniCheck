import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { start } from "../../testing/testApp.js";

afterEach(() => vi.useRealTimers());

const NOW = "2026-10-05T12:00:00-03:00";

function decide(
  ctx: Awaited<ReturnType<typeof start>>,
  token: string,
  requestId: string,
  itemId: string,
  body: object,
) {
  return request(ctx.app)
    .post(`/admin/solicitacoes/${requestId}/itens/${itemId}/decisao`)
    .set("Authorization", token)
    .send(body);
}

describe("GET /admin/solicitacoes", () => {
  it("lista a fila de pendentes com o solicitante", async () => {
    const ctx = await start(NOW);
    const response = await request(ctx.app)
      .get("/admin/solicitacoes?status=PENDENTE")
      .set("Authorization", ctx.coord);
    expect(response.status).toBe(200);
    expect(response.body.map((item: { id: string }) => item.id)).toEqual([
      "1002",
      "1007",
    ]);
    expect(response.body[0].requester).toMatchObject({
      name: "Prof. Ricardo Mendes",
      role: "professor",
    });
  });

  it("a coordenação consulta, mas professor não", async () => {
    const ctx = await start(NOW);
    expect(
      (
        await request(ctx.app)
          .get("/admin/solicitacoes")
          .set("Authorization", ctx.coord)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(ctx.app)
          .get("/admin/solicitacoes")
          .set("Authorization", ctx.professor)
      ).status,
    ).toBe(403);
  });

  it("filtra por data e valida o status", async () => {
    const ctx = await start(NOW);
    const byDate = await request(ctx.app)
      .get("/admin/solicitacoes?date=2026-10-07")
      .set("Authorization", ctx.coord);
    expect(byDate.body.map((item: { id: string }) => item.id)).toEqual([
      "1002",
    ]);
    const invalid = await request(ctx.app)
      .get("/admin/solicitacoes?status=XYZ")
      .set("Authorization", ctx.coord);
    expect(invalid.status).toBe(400);
  });
});

describe("POST /admin/solicitacoes/:id/itens/:itemId/decisao", () => {
  it("aprova um item pendente e registra quem decidiu", async () => {
    const ctx = await start(NOW);
    const response = await decide(ctx, ctx.coord, "1002", "1003", {
      decision: "approve",
    });
    expect(response.status).toBe(200);
    expect(response.body.items[0]).toMatchObject({
      status: "APROVADO",
      statusLabel: "Aprovado",
    });

    // Decidir de novo o mesmo item não é permitido.
    expect(
      (await decide(ctx, ctx.coord, "1002", "1003", { decision: "approve" }))
        .status,
    ).toBe(409);
  });

  it("exige motivo para recusar e mostra o motivo ao solicitante", async () => {
    const ctx = await start(NOW);
    const semMotivo = await decide(ctx, ctx.coord, "1002", "1003", {
      decision: "refuse",
    });
    expect(semMotivo.status).toBe(400);
    expect(semMotivo.body.message).toBe("Toda recusa precisa de motivo.");

    const recusa = await decide(ctx, ctx.coord, "1002", "1003", {
      decision: "refuse",
      reason: "Kit em manutenção.",
    });
    expect(recusa.status).toBe(200);

    const visto = await request(ctx.app)
      .get("/solicitacoes/1002")
      .set("Authorization", ctx.professor);
    expect(visto.body.items[0]).toMatchObject({
      status: "RECUSADO",
      refusalReason: "Kit em manutenção.",
    });
  });

  it("só a Coordenação decide", async () => {
    const ctx = await start(NOW);
    expect(
      (await decide(ctx, ctx.aluno, "1002", "1003", { decision: "approve" }))
        .status,
    ).toBe(403);
    expect(
      (
        await decide(ctx, ctx.professor, "1002", "1003", {
          decision: "approve",
        })
      ).status,
    ).toBe(403);
  });

  it("responde 404 para solicitação ou item inexistente e 400 para decisão inválida", async () => {
    const ctx = await start(NOW);
    expect(
      (await decide(ctx, ctx.coord, "9999", "1003", { decision: "approve" }))
        .status,
    ).toBe(404);
    expect(
      (await decide(ctx, ctx.coord, "1002", "9999", { decision: "approve" }))
        .status,
    ).toBe(404);
    expect(
      (await decide(ctx, ctx.coord, "1002", "1003", { decision: "talvez" }))
        .status,
    ).toBe(400);
  });

  // O cenário que justifica reconferir na aprovação: pedido pendente não segura estoque.
  async function doisPedidosDoMesmoProjetor(
    ctx: Awaited<ReturnType<typeof start>>,
  ) {
    const body = {
      date: "2026-10-09",
      room: "1001",
      pickupTime: "09:00",
      returnTime: "11:00",
      items: [{ type: "material", id: "1001" }],
    };
    const first = await request(ctx.app)
      .post("/solicitacoes")
      .set("Authorization", ctx.professor)
      .send(body);
    const second = await request(ctx.app)
      .post("/solicitacoes")
      .set("Authorization", ctx.professor)
      .send(body);
    expect([first.status, second.status]).toEqual([201, 201]);
    return [first.body, second.body] as const;
  }

  it("não aprova o segundo pedido do mesmo item na mesma janela", async () => {
    const ctx = await start(NOW);
    const [first, second] = await doisPedidosDoMesmoProjetor(ctx);

    expect(
      (
        await decide(ctx, ctx.coord, first.id, first.items[0].id, {
          decision: "approve",
        })
      ).status,
    ).toBe(200);
    const conflito = await decide(
      ctx,
      ctx.coord,
      second.id,
      second.items[0].id,
      { decision: "approve" },
    );
    expect(conflito.status).toBe(409);
    expect(conflito.body.message).toContain("não tem unidades suficientes");
  });

  it("com duas aprovações simultâneas, só uma passa", async () => {
    const ctx = await start(NOW);
    const [first, second] = await doisPedidosDoMesmoProjetor(ctx);

    const responses = await Promise.all([
      decide(ctx, ctx.coord, first.id, first.items[0].id, {
        decision: "approve",
      }),
      decide(ctx, ctx.coord, second.id, second.items[0].id, {
        decision: "approve",
      }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
  });
});

describe("GET /admin/solicitacoes/:id", () => {
  it("carrega o pedido selecionado e mantém o acesso após o parecer", async () => {
    const ctx = await start(NOW);
    const before = await request(ctx.app)
      .get("/admin/solicitacoes/1002")
      .set("Authorization", ctx.coord);
    expect(before.status).toBe(200);
    expect(before.body).toMatchObject({
      id: "1002",
      requester: { name: "Prof. Ricardo Mendes" },
    });
    expect(JSON.stringify(before.body)).not.toMatch(/senhaHash|jwtSecret/);
    await decide(ctx, ctx.coord, "1002", "1003", {
      decision: "refuse",
      reason: "Em manutenção.",
    });
    const after = await request(ctx.app)
      .get("/admin/solicitacoes/1002")
      .set("Authorization", ctx.coord);
    expect(after.body.items[0]).toMatchObject({
      status: "RECUSADO",
      refusalReason: "Em manutenção.",
    });
    const pending = await request(ctx.app)
      .get("/admin/solicitacoes?status=PENDENTE")
      .set("Authorization", ctx.coord);
    expect(pending.body.map((item: { id: string }) => item.id)).not.toContain(
      "1002",
    );
  });
  it("exige autenticação e perfil administrativo, e responde 404 para ID ausente", async () => {
    const ctx = await start(NOW);
    expect(
      (await request(ctx.app).get("/admin/solicitacoes/1002")).status,
    ).toBe(401);
    for (const token of [ctx.professor, ctx.aluno]) {
      expect(
        (
          await request(ctx.app)
            .get("/admin/solicitacoes/1002")
            .set("Authorization", token)
        ).status,
      ).toBe(403);
    }
    expect(
      (
        await request(ctx.app)
          .get("/admin/solicitacoes/9999")
          .set("Authorization", ctx.coord)
      ).status,
    ).toBe(404);
  });
});
