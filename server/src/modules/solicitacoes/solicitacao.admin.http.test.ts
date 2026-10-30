// Contrato HTTP com repositories substituídos: não testa persistência nem transações MySQL.
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "../../config.js";
import type { Solicitacao, Usuario } from "../../database/types.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { usuarioRepository } from "../usuarios/usuario.repository.js";
import { chaveRepository } from "../chaves/chave.repository.js";
import { solicitacaoRepository } from "./solicitacao.repository.js";
import { solicitacaoAdminRoutes } from "./solicitacao.admin.routes.js";

vi.mock("../usuarios/usuario.repository.js", () => ({
  usuarioRepository: { findById: vi.fn(), listAll: vi.fn() },
}));
vi.mock("../chaves/chave.repository.js", () => ({
  chaveRepository: { listSalas: vi.fn() },
}));
vi.mock("./solicitacao.repository.js", () => ({
  solicitacaoRepository: { findById: vi.fn() },
}));

const owner: Usuario = {
  id: "2",
  nome: "Ana",
  identificador: "123",
  matricula: "123",
  perfil: "PROFESSOR",
  autorizado: false,
  ativo: true,
  senhaHash: "hash-privado",
};
const users: Record<string, Usuario> = {
  "1": { ...owner, id: "1", perfil: "COORDENADOR" },
  "2": owner,
  "3": { ...owner, id: "3", perfil: "ALUNO" },
  "4": { ...owner, id: "4", perfil: "FUNCIONARIO" },
  "5": { ...owner, id: "5", perfil: "COORDENADOR", ativo: false },
};
const pedido: Solicitacao = {
  id: "42",
  protocolo: "CCT-2026-00042",
  usuarioId: "2",
  criadoEm: "2026-10-29T09:00:00-03:00",
  salaId: "1",
  dataUtilizacao: "2026-11-02",
  retiradaPrevista: "09:00",
  devolucaoPrevista: "11:00",
  itens: [
    {
      id: "7",
      tipo: "MATERIAL",
      referenciaId: "1",
      nome: "Projetor",
      quantidade: 1,
      status: "RECUSADO",
      atualizadoEm: "2026-10-29T10:00:00-03:00",
      motivoRecusa: "Em manutenção",
      decididoPorId: "1",
    },
  ],
};
const app = express();
app.use(express.json());
app.use("/admin/solicitacoes", solicitacaoAdminRoutes);
app.use(errorHandler);
const token = (id: string) =>
  `Bearer ${jwt.sign({}, config.jwtSecret, { subject: id, algorithm: "HS256" })}`;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(usuarioRepository.findById).mockImplementation(
    async (id) => users[id],
  );
  vi.mocked(chaveRepository.listSalas).mockResolvedValue([
    { id: "1", codigo: "J-201", nome: "Laboratório", ativo: true },
  ]);
  vi.mocked(solicitacaoRepository.findById).mockImplementation(async (id) =>
    id === "42" ? pedido : undefined,
  );
});
describe("contrato de detalhe administrativo (sem banco)", () => {
  it("retorna o ID solicitado com parecer e dados públicos para coordenação e secretaria", async () => {
    for (const id of ["1", "4"]) {
      const res = await request(app)
        .get("/admin/solicitacoes/42")
        .set("Authorization", token(id));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: "42",
        room: { label: "J-201 · Laboratório" },
        requester: { name: "Ana", registration: "123" },
        items: [
          {
            id: "7",
            type: "material",
            status: "RECUSADO",
            refusalReason: "Em manutenção",
          },
        ],
      });
      expect(JSON.stringify(res.body)).not.toMatch(
        /senhaHash|hash-privado|decididoPorId/,
      );
    }
    expect(solicitacaoRepository.findById).toHaveBeenCalledWith("42");
  });
  it("não revela os detalhes para professor, aluno, usuário inativo ou sem login", async () => {
    expect((await request(app).get("/admin/solicitacoes/42")).status).toBe(401);
    for (const id of ["2", "3"])
      expect(
        (
          await request(app)
            .get("/admin/solicitacoes/42")
            .set("Authorization", token(id))
        ).status,
      ).toBe(403);
    expect(
      (
        await request(app)
          .get("/admin/solicitacoes/42")
          .set("Authorization", token("5"))
      ).status,
    ).toBe(401);
    expect(solicitacaoRepository.findById).not.toHaveBeenCalled();
  });
  it("retorna 404 para pedido ausente", async () => {
    const res = await request(app)
      .get("/admin/solicitacoes/999")
      .set("Authorization", token("1"));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Solicitação não encontrada.");
  });
});
