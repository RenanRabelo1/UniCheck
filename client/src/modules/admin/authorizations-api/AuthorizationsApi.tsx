import { useRef, useState, type FormEvent } from "react";

import {
  createAuthorization,
  createProject,
  loadAuthorizations,
  setAuthorizationActive,
  setProjectActive,
  type Authorization,
  type AuthorizationsData,
  type Project,
} from "../../../services/authorizations";
import { useRequestData } from "../../solicitacoes/useRequestData";
import { errorMessage } from "../operations-api/operations.shared";
import { formatRequestDate } from "../requests-api/format";
import "../authorizations-projects/authorizations-projects.css";
import "../requests-api/requestsApi.css";

type StateFilter = "all" | "active" | "inactive";

/** Tela 15 conectada: alunos e professores vêm do cadastro de usuários; nada é apagado, só inativado. */
export function AuthorizationsApi() {
  const { data, loading, error, retry } = useRequestData(loadAuthorizations);
  // Ficam aqui: recarregar a lista desmonta o conteúdo, e a confirmação precisa continuar visível.
  const [notice, setNotice] = useState("");

  return (
    <section
      className="authorizations-projects"
      aria-labelledby="authorizations-projects-title"
    >
      <header className="authorizations-projects__header">
        <div>
          <p className="authorizations-projects__eyebrow">Administração</p>
          <h1 id="authorizations-projects-title">
            Alunos autorizados e projetos
          </h1>
          <p>Defina quais alunos podem solicitar chaves em cada projeto.</p>
        </div>
        <button
          className="admin-api-button"
          type="button"
          onClick={retry}
          disabled={loading}
        >
          Atualizar
        </button>
      </header>

      {notice && (
        <p className="admin-api-success" role="status">
          {notice}
        </p>
      )}
      {loading && <p role="status">Carregando autorizações…</p>}
      {error && (
        <div className="admin-api-error" role="alert">
          <p>{error}</p>
          <button className="admin-api-button" type="button" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      )}
      {data && (
        <AuthorizationsContent
          data={data}
          onNotice={setNotice}
          onChanged={retry}
        />
      )}
    </section>
  );
}

function AuthorizationsContent({
  data,
  onNotice,
  onChanged,
}: {
  data: AuthorizationsData;
  onNotice: (message: string) => void;
  onChanged: () => void;
}) {
  const { projects, authorizations, options } = data;
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    professorId: "",
  });
  const [authorizationForm, setAuthorizationForm] = useState({
    studentId: "",
    projectId: "",
  });
  const [query, setQuery] = useState("");
  const [state, setState] = useState<StateFilter>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [problem, setProblem] = useState("");
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);

  const search = query.trim().toLocaleLowerCase("pt-BR");
  const visible = authorizations.filter(
    (item) =>
      `${item.student.name} ${item.student.registration} ${item.student.email}`
        .toLocaleLowerCase("pt-BR")
        .includes(search) &&
      (state === "all" || item.active === (state === "active")) &&
      (projectFilter === "all" || item.project.id === projectFilter),
  );
  const activeCount = authorizations.filter((item) => item.active).length;

  async function run(action: () => Promise<string>, fallback: string) {
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    setProblem("");
    onNotice("");
    try {
      onNotice(await action());
      onChanged();
    } catch (cause) {
      setProblem(errorMessage(cause, fallback));
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const description = projectForm.description.trim();
    void run(async () => {
      const project = await createProject({
        name: projectForm.name.trim(),
        ...(description ? { description } : {}),
        professorId: projectForm.professorId,
      });
      return `Projeto ${project.name} cadastrado.`;
    }, "Não foi possível cadastrar o projeto.");
  }

  function submitAuthorization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const created = await createAuthorization(authorizationForm);
      return `${created.student.name} autorizado(a) em ${created.project.name}.`;
    }, "Não foi possível autorizar o aluno.");
  }

  const toggleProject = (project: Project) =>
    run(async () => {
      await setProjectActive(project.id, !project.active);
      return `Projeto ${project.name} ${project.active ? "inativado" : "reativado"}.`;
    }, "Não foi possível alterar o projeto.");

  const toggleAuthorization = (item: Authorization) =>
    run(async () => {
      await setAuthorizationActive(item.id, !item.active);
      return `Autorização de ${item.student.name} ${item.active ? "inativada" : "reativada"}.`;
    }, "Não foi possível alterar a autorização.");

  return (
    <>
      {problem && (
        <p className="admin-api-error" role="alert">
          {problem}
        </p>
      )}

      <div className="authorizations-projects__totals" aria-label="Totais">
        <article>
          <strong>{activeCount}</strong>
          <span>autorizações ativas</span>
        </article>
        <article>
          <strong>{projects.filter((item) => item.active).length}</strong>
          <span>projetos ativos</span>
        </article>
        <article>
          <strong>{authorizations.length - activeCount}</strong>
          <span>autorizações inativas</span>
        </article>
      </div>

      <div className="authorizations-projects__grid">
        <form
          className="authorizations-projects__card"
          onSubmit={submitProject}
        >
          <h2>Cadastrar projeto</h2>
          <label>
            Nome do projeto
            <input
              required
              value={projectForm.name}
              onChange={(event) =>
                setProjectForm({ ...projectForm, name: event.target.value })
              }
            />
          </label>
          <label>
            Descrição (opcional)
            <input
              value={projectForm.description}
              onChange={(event) =>
                setProjectForm({
                  ...projectForm,
                  description: event.target.value,
                })
              }
            />
          </label>
          <label>
            Professor responsável
            <select
              required
              value={projectForm.professorId}
              onChange={(event) =>
                setProjectForm({
                  ...projectForm,
                  professorId: event.target.value,
                })
              }
            >
              <option value="">Selecione</option>
              {options.professors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.registration}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={saving}>
            Adicionar projeto
          </button>
        </form>

        <form
          className="authorizations-projects__card"
          onSubmit={submitAuthorization}
        >
          <h2>Nova autorização</h2>
          <label>
            Aluno
            <select
              required
              value={authorizationForm.studentId}
              onChange={(event) =>
                setAuthorizationForm({
                  ...authorizationForm,
                  studentId: event.target.value,
                })
              }
            >
              <option value="">Selecione</option>
              {options.students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.registration}
                </option>
              ))}
            </select>
          </label>
          <label>
            Projeto
            <select
              required
              value={authorizationForm.projectId}
              onChange={(event) =>
                setAuthorizationForm({
                  ...authorizationForm,
                  projectId: event.target.value,
                })
              }
            >
              <option value="">Selecione</option>
              {projects
                .filter((item) => item.active && item.professor.active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="authorizations-projects__form-actions">
            <button type="submit" disabled={saving}>
              Autorizar aluno
            </button>
          </div>
        </form>
      </div>

      <section
        className="authorizations-projects__card"
        aria-label="Projetos cadastrados"
      >
        <div className="authorizations-projects__section-title">
          <div>
            <h2>Projetos cadastrados</h2>
            <p>
              O projeto e o professor precisam estar ativos para solicitar uma
              chave.
            </p>
          </div>
        </div>
        <div className="authorizations-projects__project-list">
          {projects.map((project) => (
            <article
              key={project.id}
              className="authorizations-projects__project"
            >
              <div>
                <strong>{project.name}</strong>
                <span>{project.professor.name}</span>
              </div>
              <div className="authorizations-projects__project-actions">
                <span
                  className={`authorizations-projects__badge authorizations-projects__badge--${project.active ? "ativo" : "inativo"}`}
                >
                  {project.active ? "Ativo" : "Inativo"}
                </span>
                {!project.professor.active && (
                  <span className="authorizations-projects__warning">
                    Professor inativo
                  </span>
                )}
                <button
                  type="button"
                  className="authorizations-projects__button--secondary"
                  disabled={saving}
                  onClick={() => void toggleProject(project)}
                >
                  {project.active ? "Inativar" : "Reativar"}
                </button>
              </div>
            </article>
          ))}
          {projects.length === 0 && <p>Nenhum projeto cadastrado.</p>}
        </div>
      </section>

      <section className="authorizations-projects__card">
        <div className="authorizations-projects__section-title">
          <div>
            <h2>Autorizações de alunos</h2>
            <p>Autorizações inativas permanecem no histórico.</p>
          </div>
        </div>
        <div className="authorizations-projects__filters">
          <label>
            Buscar aluno ou matrícula
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            Estado
            <select
              value={state}
              onChange={(event) => setState(event.target.value as StateFilter)}
            >
              <option value="all">Todos</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </select>
          </label>
          <label>
            Filtrar projeto
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
            >
              <option value="all">Todos os projetos</option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="authorizations-projects__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Projeto</th>
                <th>Professor</th>
                <th>Autorização</th>
                <th>Situação para chave</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.student.name}</strong>
                    <span>
                      {item.student.registration} · {item.student.email}
                    </span>
                  </td>
                  <td>{item.project.name}</td>
                  <td>{item.professor.name}</td>
                  <td>
                    {formatRequestDate(item.authorizedAt)}
                    <span>Por {item.coordinator}</span>
                    {item.inactivatedAt && (
                      <span>
                        Inativada em {formatRequestDate(item.inactivatedAt)}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`authorizations-projects__badge authorizations-projects__badge--${item.canRequestKey ? "ativo" : "inativo"}`}
                    >
                      {item.canRequestKey
                        ? "Pode solicitar chave"
                        : "Bloqueada"}
                    </span>
                  </td>
                  <td>
                    <div className="authorizations-projects__row-actions">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void toggleAuthorization(item)}
                      >
                        {item.active ? "Inativar" : "Reativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="authorizations-projects__empty">
                    Nenhuma autorização encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
