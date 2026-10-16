import { useMemo, useState, type FormEvent } from 'react';

import { initialAuthorizations, initialProjects } from './authorizations-projects.mock';
import type {
  AuthorizationsProjectsProps,
  AuthorizationState,
  Project,
  StudentAuthorization,
} from './types';
import './authorizations-projects.css';

const today = '16/10/2026';

const emptyProject = { name: '', code: '', professor: '' };
const emptyAuthorization = { student: '', registration: '', projectId: '' };

export function AuthorizationsProjects({ onStateChange }: AuthorizationsProjectsProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [authorizations, setAuthorizations] = useState<StudentAuthorization[]>(initialAuthorizations);
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<'TODAS' | AuthorizationState>('TODAS');
  const [projectFilter, setProjectFilter] = useState('TODOS');
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [authorizationForm, setAuthorizationForm] = useState(emptyAuthorization);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  const activeProjects = projects.filter((project) => project.state === 'ATIVO');
  const activeAuthorizations = authorizations.filter((authorization) => authorization.state === 'ATIVA');
  const selectedHistory = authorizations.find((authorization) => authorization.id === historyId);

  const filteredAuthorizations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');

    return authorizations.filter((authorization) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        authorization.student.toLocaleLowerCase('pt-BR').includes(normalizedQuery) ||
        authorization.registration.includes(normalizedQuery);
      const matchesState = stateFilter === 'TODAS' || authorization.state === stateFilter;
      const matchesProject = projectFilter === 'TODOS' || authorization.projectId === projectFilter;

      return matchesQuery && matchesState && matchesProject;
    });
  }, [authorizations, projectFilter, query, stateFilter]);

  const emitSnapshot = (nextProjects: Project[], nextAuthorizations: StudentAuthorization[]) => {
    onStateChange?.({ projects: nextProjects, authorizations: nextAuthorizations });
  };

  const submitProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextProject: Project = {
      id: `project-${Date.now()}`,
      name: projectForm.name.trim(),
      code: projectForm.code.trim().toUpperCase(),
      professor: projectForm.professor.trim(),
      professorActive: true,
      state: 'ATIVO',
      updatedAt: today,
    };
    const nextProjects = [...projects, nextProject];

    setProjects(nextProjects);
    setProjectForm(emptyProject);
    emitSnapshot(nextProjects, authorizations);
  };

  const submitAuthorization = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const project = projects.find((item) => item.id === authorizationForm.projectId);

    if (!project) return;

    if (editingId) {
      const nextAuthorizations = authorizations.map((authorization) =>
        authorization.id === editingId
          ? {
              ...authorization,
              student: authorizationForm.student.trim(),
              registration: authorizationForm.registration.trim(),
              projectId: authorizationForm.projectId,
              updatedAt: today,
              history: [
                ...authorization.history,
                { id: `history-${Date.now()}`, action: `Autorização editada para ${project.name}`, date: today },
              ],
            }
          : authorization,
      );
      setAuthorizations(nextAuthorizations);
      emitSnapshot(projects, nextAuthorizations);
    } else {
      const nextAuthorization: StudentAuthorization = {
        id: `authorization-${Date.now()}`,
        student: authorizationForm.student.trim(),
        registration: authorizationForm.registration.trim(),
        projectId: authorizationForm.projectId,
        state: 'ATIVA',
        createdAt: today,
        updatedAt: today,
        history: [{ id: `history-${Date.now()}`, action: 'Autorização criada', date: today }],
      };
      const nextAuthorizations = [...authorizations, nextAuthorization];
      setAuthorizations(nextAuthorizations);
      emitSnapshot(projects, nextAuthorizations);
    }

    setAuthorizationForm(emptyAuthorization);
    setEditingId(null);
  };

  const editAuthorization = (authorization: StudentAuthorization) => {
    setEditingId(authorization.id);
    setAuthorizationForm({
      student: authorization.student,
      registration: authorization.registration,
      projectId: authorization.projectId,
    });
  };

  const toggleAuthorization = (authorization: StudentAuthorization) => {
    const nextState: AuthorizationState = authorization.state === 'ATIVA' ? 'INATIVA' : 'ATIVA';
    const nextAuthorizations = authorizations.map((item) =>
      item.id === authorization.id
        ? {
            ...item,
            state: nextState,
            updatedAt: today,
            history: [
              ...item.history,
              { id: `history-${Date.now()}`, action: `Autorização ${nextState.toLocaleLowerCase('pt-BR')}`, date: today },
            ],
          }
        : item,
    );

    setAuthorizations(nextAuthorizations);
    emitSnapshot(projects, nextAuthorizations);
  };

  const toggleProject = (project: Project) => {
    const nextProjects = projects.map((item) =>
      item.id === project.id
        ? { ...item, state: item.state === 'ATIVO' ? 'INATIVO' : 'ATIVO', updatedAt: today }
        : item,
    );

    setProjects(nextProjects);
    emitSnapshot(nextProjects, authorizations);
  };

  const projectFor = (projectId: string) => projects.find((project) => project.id === projectId);

  return (
    <section className="authorizations-projects" aria-labelledby="authorizations-projects-title">
      <header className="authorizations-projects__header">
        <div>
          <p className="authorizations-projects__eyebrow">Administração</p>
          <h1 id="authorizations-projects-title">Alunos autorizados e projetos</h1>
          <p>Gerencie demonstrações locais de projetos e permissões para retirada de chaves.</p>
        </div>
        <span className="authorizations-projects__demo">Ações demonstrativas — sem persistência</span>
      </header>

      <div className="authorizations-projects__totals" aria-label="Totais">
        <article><strong>{activeAuthorizations.length}</strong><span>alunos autorizados</span></article>
        <article><strong>{activeProjects.length}</strong><span>projetos ativos</span></article>
        <article><strong>{authorizations.length - activeAuthorizations.length}</strong><span>autorizações inativas</span></article>
      </div>

      <div className="authorizations-projects__grid">
        <form className="authorizations-projects__card" onSubmit={submitProject}>
          <h2>Cadastrar projeto</h2>
          <label>Nome do projeto<input required value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} /></label>
          <label>Código<input required value={projectForm.code} onChange={(event) => setProjectForm({ ...projectForm, code: event.target.value })} /></label>
          <label>Professor responsável<input required value={projectForm.professor} onChange={(event) => setProjectForm({ ...projectForm, professor: event.target.value })} /></label>
          <button type="submit">Adicionar projeto</button>
        </form>

        <form className="authorizations-projects__card" onSubmit={submitAuthorization}>
          <h2>{editingId ? 'Editar autorização' : 'Nova autorização'}</h2>
          <label>Aluno<input required value={authorizationForm.student} onChange={(event) => setAuthorizationForm({ ...authorizationForm, student: event.target.value })} /></label>
          <label>Matrícula<input required value={authorizationForm.registration} onChange={(event) => setAuthorizationForm({ ...authorizationForm, registration: event.target.value })} /></label>
          <label>Projeto<select required value={authorizationForm.projectId} onChange={(event) => setAuthorizationForm({ ...authorizationForm, projectId: event.target.value })}><option value="">Selecione</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <div className="authorizations-projects__form-actions">
            <button type="submit">{editingId ? 'Salvar alteração' : 'Autorizar aluno'}</button>
            {editingId && <button type="button" className="authorizations-projects__button--secondary" onClick={() => { setEditingId(null); setAuthorizationForm(emptyAuthorization); }}>Cancelar</button>}
          </div>
        </form>
      </div>

      <section className="authorizations-projects__card">
        <div className="authorizations-projects__section-title"><div><h2>Projetos cadastrados</h2><p>O projeto e o professor precisam estar ativos para solicitar uma chave.</p></div></div>
        <div className="authorizations-projects__project-list">
          {projects.map((project) => (
            <article key={project.id} className="authorizations-projects__project">
              <div><strong>{project.name}</strong><span>{project.code} · {project.professor}</span></div>
              <div className="authorizations-projects__project-actions"><span className={`authorizations-projects__badge authorizations-projects__badge--${project.state.toLowerCase()}`}>{project.state}</span>{!project.professorActive && <span className="authorizations-projects__warning">Professor inativo</span>}<button type="button" className="authorizations-projects__button--secondary" onClick={() => toggleProject(project)}>{project.state === 'ATIVO' ? 'Inativar' : 'Reativar'}</button></div>
            </article>
          ))}
        </div>
      </section>

      <section className="authorizations-projects__card">
        <div className="authorizations-projects__section-title"><div><h2>Autorizações de alunos</h2><p>Filtre, consulte o histórico e atualize os estados localmente.</p></div></div>
        <div className="authorizations-projects__filters">
          <label>Buscar aluno ou matrícula<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: Ana ou 2310" /></label>
          <label>Estado<select value={stateFilter} onChange={(event) => setStateFilter(event.target.value as 'TODAS' | AuthorizationState)}><option value="TODAS">Todos</option><option value="ATIVA">Ativas</option><option value="INATIVA">Inativas</option></select></label>
          <label>Projeto<select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="TODOS">Todos os projetos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        </div>
        <div className="authorizations-projects__table-wrap">
          <table><thead><tr><th>Aluno</th><th>Projeto</th><th>Situação para chave</th><th>Atualização</th><th>Ações</th></tr></thead><tbody>
            {filteredAuthorizations.map((authorization) => {
              const project = projectFor(authorization.projectId);
              const canRequestKey = authorization.state === 'ATIVA' && project?.state === 'ATIVO' && project.professorActive;
              return <tr key={authorization.id}><td><strong>{authorization.student}</strong><span>{authorization.registration}</span></td><td>{project?.name ?? 'Projeto indisponível'}</td><td><span className={`authorizations-projects__badge authorizations-projects__badge--${canRequestKey ? 'ativa' : 'inativa'}`}>{canRequestKey ? 'Pode solicitar chave' : 'Bloqueada'}</span></td><td>{authorization.updatedAt}</td><td><div className="authorizations-projects__row-actions"><button type="button" onClick={() => editAuthorization(authorization)}>Editar</button><button type="button" onClick={() => setHistoryId(authorization.id)}>Histórico</button><button type="button" onClick={() => toggleAuthorization(authorization)}>{authorization.state === 'ATIVA' ? 'Inativar' : 'Reativar'}</button></div></td></tr>;
            })}
            {filteredAuthorizations.length === 0 && <tr><td colSpan={5} className="authorizations-projects__empty">Nenhuma autorização encontrada.</td></tr>}
          </tbody></table>
        </div>
      </section>

      {selectedHistory && <div className="authorizations-projects__dialog-backdrop" role="presentation"><section className="authorizations-projects__dialog" role="dialog" aria-modal="true" aria-labelledby="history-title"><div><h2 id="history-title">Histórico de {selectedHistory.student}</h2><p>Eventos demonstrativos desta sessão.</p></div><button type="button" aria-label="Fechar histórico" onClick={() => setHistoryId(null)}>×</button><ol>{selectedHistory.history.map((entry) => <li key={entry.id}><strong>{entry.action}</strong><span>{entry.date}</span></li>)}</ol></section></div>}
    </section>
  );
}
