import { FormEvent, useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { MyRequestsScreen } from "./components/MyRequestsScreen";
import type { MyRequest } from "./components/MyRequestsScreen.mock";
import { NewRequestScreen } from "./components/NewRequestScreen";
import { RequestConfirmationScreen } from "./components/RequestConfirmationScreen";
import type { RequestConfirmationData } from "./components/RequestConfirmationScreen";
import { RequestDetailsScreen } from "./components/RequestDetailsScreen";
import type {
  RequestDetails,
  RequestItemStatus,
} from "./components/RequestDetailsScreen";
import { UserDashboard } from "./components/UserDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
import type { DashboardSession } from "./modules/dashboard/dashboard.types";

type Role = "professor" | "student" | "coordinator";
type AppView =
  | "dashboard"
  | "new-request"
  | "confirmation"
  | "my-requests"
  | "request-details";

const roles: { id: Role; label: string; accessLabel: string }[] = [
  { id: "professor", label: "Professor", accessLabel: "Acesso do professor" },
  { id: "student", label: "Aluno", accessLabel: "Acesso do aluno" },
  {
    id: "coordinator",
    label: "Coordenador CCT",
    accessLabel: "Acesso do coordenador",
  },
];

const quickAccess = [
  {
    label: "Prof. Ricardo Mendes",
    identifier: "2048819",
    role: "professor" as const,
  },
  {
    label: "Aluno Autorizado",
    identifier: "aluno.autorizado@unifor.br",
    role: "student" as const,
  },
  {
    label: "Coordenador CCT",
    identifier: "18024900",
    role: "coordinator" as const,
  },
  {
    label: "Aluno s/ Autorização",
    identifier: "aluno.naoautorizado@unifor.br",
    role: "student" as const,
  },
];

const highlights = [
  ["🔑", "Chaves de salas", "Laboratórios e salas de aula"],
  ["📽️", "Equipamentos", "Projetores, adaptadores e kits"],
  ["📋", "Controle total", "Histórico completo de uso"],
  ["👤", "Multi-perfil", "Docentes e discentes autorizados"],
];

const requestStatusMap: Record<MyRequest["status"], RequestItemStatus> = {
  "in-possession": "RETIRADO",
  approved: "APROVADO",
  pending: "PENDENTE",
  returned: "DEVOLVIDO",
  rejected: "RECUSADO",
};

function mapRequestDetails(
  request: MyRequest,
  session: DashboardSession,
): RequestDetails {
  const itemStatus = requestStatusMap[request.status];
  const itemNames = [request.item, request.secondaryItem].filter(
    (item): item is string => Boolean(item),
  );

  return {
    id: request.id,
    protocol: request.protocol,
    statusLabel: request.instruction,
    requester: {
      name: session.name,
      role: session.roleLabel,
      registration: session.registration,
    },
    purpose: "Atividade acadêmica no Centro de Ciências Tecnológicas",
    location: request.destination,
    requestedAt: request.requestedAt,
    period: request.schedule,
    items: itemNames.map((name, index) => ({
      id: `${request.id}-${index}`,
      name,
      description:
        index === 0
          ? "Item principal da solicitação"
          : "Item complementar da solicitação",
      quantity: 1,
      status: itemStatus,
      rejectionReason:
        itemStatus === "RECUSADO" ? request.instruction : undefined,
      pickup:
        itemStatus === "RETIRADO" || itemStatus === "DEVOLVIDO"
          ? { date: request.requestedAt, attendant: "Secretaria CCT" }
          : undefined,
      return:
        itemStatus === "RETIRADO"
          ? { dueDate: request.schedule.split(" - ")[1] ?? "21:00" }
          : itemStatus === "DEVOLVIDO"
            ? {
                dueDate: request.schedule,
                date: request.instruction,
                attendant: "Secretaria CCT",
              }
            : undefined,
    })),
    timeline: [
      {
        id: `${request.id}-current`,
        date: request.requestedAt,
        title: request.instruction,
        description: `Situação atual: ${request.status}.`,
        isNextStep:
          request.status === "approved" || request.status === "in-possession",
      },
      {
        id: `${request.id}-created`,
        date: request.requestedAt,
        title: "Solicitação registrada",
        description: "Pedido enviado pelo portal acadêmico.",
      },
    ],
  };
}

function App() {
  const [role, setRole] = useState<Role>("professor");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [requestForReview, setRequestForReview] =
    useState<RequestConfirmationData | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MyRequest | null>(
    null,
  );

  const isStudent = role === "student";
  const currentRole = roles.find((item) => item.id === role)!;
  const identifierLabel = isStudent ? "E-mail institucional" : "Matrícula";
  const identifierPlaceholder = isStudent
    ? "seu.email@unifor.br"
    : role === "professor"
      ? "Ex.: 2048819"
      : "Ex.: 18024900";

  function changeRole(nextRole: Role) {
    setRole(nextRole);
    setIdentifier("");
    setPassword("");
    setMessage("");
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!identifier.trim()) {
      setMessage(`Informe ${identifierLabel.toLowerCase()}.`);
      setMessageType("error");
      return;
    }
    if (!password.trim()) {
      setMessage("Informe sua senha.");
      setMessageType("error");
      return;
    }
    if (role === "coordinator" && password.length < 8) {
      setMessage("A senha do Coordenador CCT deve ter no mínimo 8 caracteres.");
      setMessageType("error");
      return;
    }

    if (role === "coordinator") {
      setActiveView("dashboard");
      setShowDashboard(true);
      return;
    }

    setActiveView("dashboard");
    setShowDashboard(true);
  }

  function fillQuickAccess(item: (typeof quickAccess)[number]) {
    setRole(item.role);
    setIdentifier(item.identifier);
    setPassword("");
    setMessage(
      "Dados de demonstração preenchidos. Informe uma senha para continuar.",
    );
    setMessageType("success");
  }

  function logout() {
    setShowDashboard(false);
    setActiveView("dashboard");
    setRequestForReview(null);
    setSelectedRequest(null);
    setPassword("");
    setMessage("Sessão encerrada.");
    setMessageType("success");
  }

  if (showDashboard) {
    if (role === "coordinator") {
      return (
        <AdminDashboard
          session={{
            name: "Marcos Silva",
            registration: identifier,
            role: "coordinator",
            roleLabel: "Coordenador CCT",
            location: "Secretaria CCT J-02",
          }}
          onLogout={logout}
        />
      );
    }

    const isStudentDashboard = role === "student";
    const session = {
      name: isStudentDashboard ? "Lucas Almeida" : "Prof. Ricardo Mendes",
      registration: isStudentDashboard
        ? "aluno.autorizado@unifor.br"
        : "2048819/CCT",
      role: isStudentDashboard ? ("student" as const) : ("professor" as const),
      roleLabel: isStudentDashboard ? "Aluno autorizado" : "Professor",
    };

    if (activeView === "new-request") {
      return (
        <NewRequestScreen
          session={session}
          onBack={() => setActiveView("dashboard")}
          onReview={(request) => {
            setRequestForReview(request);
            setActiveView("confirmation");
          }}
        />
      );
    }
    if (activeView === "confirmation" && requestForReview) {
      return (
        <RequestConfirmationScreen
          request={requestForReview}
          onBack={() => setActiveView("dashboard")}
          onEdit={() => setActiveView("new-request")}
          onConfirm={() => Promise.resolve()}
          onSuccess={() => setActiveView("my-requests")}
        />
      );
    }
    if (activeView === "my-requests") {
      return (
        <MyRequestsScreen
          session={session}
          onBack={() => setActiveView("dashboard")}
          onNewRequest={() => setActiveView("new-request")}
          onOpenRequest={(request) => {
            setSelectedRequest(request);
            setActiveView("request-details");
          }}
        />
      );
    }
    if (activeView === "request-details") {
      return (
        <RequestDetailsScreen
          request={
            selectedRequest
              ? mapRequestDetails(selectedRequest, session)
              : undefined
          }
          onBack={() => setActiveView("my-requests")}
        />
      );
    }
    if (isStudentDashboard) {
      return (
        <StudentDashboard
          session={session}
          onNewRequest={() => setActiveView("new-request")}
          onMyRequests={() => setActiveView("my-requests")}
          onLogout={logout}
        />
      );
    }
    return (
      <UserDashboard
        session={session}
        onNewRequest={() => setActiveView("new-request")}
        onMyRequests={() => setActiveView("my-requests")}
        onLogout={logout}
      />
    );
  }

  return (
    <main className="login-page">
      <div className="glow glow-top" />
      <div className="glow glow-bottom" />
      <section className="login-card" aria-label="Acesso ao sistema UniCheck">
        <div className="form-panel">
          <header className="brand-header">
            <div className="brand-lockup">
              <span className="cct-mark">CCT</span>
              <img
                src="/brand/unifor.svg"
                alt="Unifor"
                className="unifor-logo"
              />
              <span className="brand-subtitle">C. Ciências Tecnológicas</span>
            </div>
            <span className="location-badge">Bloco J-02</span>
          </header>

          <div className="form-intro">
            <h1>Acesso ao Sistema</h1>
            <p>Selecione seu perfil para continuar</p>
          </div>

          <div
            className="role-tabs"
            role="tablist"
            aria-label="Perfil de acesso"
          >
            {roles.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={role === item.id}
                className={role === item.id ? "active" : ""}
                onClick={() => changeRole(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={submitLogin} noValidate>
            <div className="access-type">⌾ {currentRole.accessLabel}</div>
            <label htmlFor="identifier">{identifierLabel}</label>
            <input
              id="identifier"
              type={isStudent ? "email" : "text"}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={identifierPlaceholder}
              autoComplete={isStudent ? "email" : "username"}
            />

            <label htmlFor="password">
              Senha{" "}
              {role === "coordinator" && <small>(mínimo 8 caracteres)</small>}
            </label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="visibility-button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "◉" : "◌"}
              </button>
            </div>

            {message && (
              <p className={`form-message ${messageType}`} role="status">
                {message}
              </p>
            )}

            <button className="submit-button" type="submit">
              Acessar <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="quick-access">
            <p>Acesso rápido (demonstração)</p>
            {quickAccess.map((item, index) => (
              <button
                key={item.identifier}
                type="button"
                className={
                  index === quickAccess.length - 1
                    ? "quick-item dashed"
                    : "quick-item"
                }
                onClick={() => fillQuickAccess(item)}
              >
                <span>{item.label}</span>
                <small>{item.identifier}</small>
              </button>
            ))}
            <small className="hint">
              Os dados são apenas demonstrativos; a validação real será feita
              pela API.
            </small>
          </div>
        </div>

        <aside className="info-panel">
          <div className="blue-pattern" aria-hidden="true" />
          <span className="secretariat-status">
            <i /> Secretaria · Bloco J-02
          </span>
          <div className="info-content">
            <h2>Gestão inteligente de recursos acadêmicos.</h2>
            <p>
              Controle unificado para requisição, custódia e devolução de chaves
              e equipamentos do Centro de Ciências Tecnológicas.
            </p>
            <div className="feature-grid">
              {highlights.map(([icon, title, description]) => (
                <article key={title}>
                  <span>{icon}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
          <footer>
            <div>
              <strong>Secretaria CCT · Bloco J-02</strong>
              <span>Atendimento: Segunda a Sexta, 07h30–21h00</span>
            </div>
            <b>
              UNIFOR <small>CCT · J-02</small>
            </b>
          </footer>
        </aside>
      </section>
    </main>
  );
}

export default App;
