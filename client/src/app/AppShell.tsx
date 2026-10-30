import { PendingRequestsApi } from "../modules/admin/requests-api/PendingRequestsApi";
import { RequestAnalysisApi } from "../modules/admin/requests-api/RequestAnalysisApi";
import { isApiMode } from "../services/api";
import { createRequest } from "../services/requests";
import { useState, type FormEvent } from "react";
import { AdminDashboard } from "../components/AdminDashboard";
import { MyRequestsScreen } from "../components/MyRequestsScreen";
import type { MyRequest } from "../components/MyRequestsScreen.mock";
import { NewRequestScreen } from "../components/NewRequestScreen";
import { RequestConfirmationScreen } from "../components/RequestConfirmationScreen";
import type { RequestConfirmationData } from "../components/RequestConfirmationScreen";
import { RequestDetailsLoader } from "../modules/solicitacoes/RequestDetailsLoader";
import { StudentDashboard } from "../components/StudentDashboard";
import { UserDashboard } from "../components/UserDashboard";
import { DemoLogin } from "../modules/auth/DemoLogin";
import { RegisterScreen } from "../modules/auth/RegisterScreen";
import { useDemoSession } from "../modules/auth/useDemoSession";
import { AuthorizationsProjects } from "../modules/admin/authorizations-projects";
import { CheckoutOperations } from "../modules/admin/checkout-operations";
import { MaterialsManagement } from "../modules/admin/materials-management/MaterialsManagement";
import { MovementHistory } from "../modules/admin/movement-history";
import { OverdueAlertsPage } from "../modules/admin/overdue-alerts/OverdueAlertsPage";
import { PendingRequestsScreen } from "../modules/admin/pending-requests";
import { RequestAnalysisScreen } from "../modules/admin/request-analysis";
import { ReturnOperations } from "../modules/admin/return-operations";
import { RoomsKeysManagement } from "../modules/admin/rooms-keys-management/RoomsKeysManagement";
import { ProfessorMaterialsCatalog } from "../modules/professor-materials/ProfessorMaterialsCatalog";
import { AdminWorkspace } from "./AdminWorkspace";
import { type AdminView, type AppView } from "./navigation";

export function AppShell() {
  const demoSession = useDemoSession();
  const [showRegister, setShowRegister] = useState(false);
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [requestForReview, setRequestForReview] =
    useState<RequestConfirmationData | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MyRequest | null>(
    null,
  );
  const [selectedAdminRequestId, setSelectedAdminRequestId] = useState<
    string | null
  >(null);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (await demoSession.login()) {
      setActiveView("dashboard");
    }
  }

  function logout() {
    setActiveView("dashboard");
    setRequestForReview(null);
    setSelectedRequest(null);
    setSelectedAdminRequestId(null);
    demoSession.logout();
  }

  if (!demoSession.session && showRegister) {
    return (
      <RegisterScreen
        onBackToLogin={() => setShowRegister(false)}
        onRegistered={(newSession) => {
          demoSession.startSession(newSession);
          setActiveView("dashboard");
          setShowRegister(false);
        }}
      />
    );
  }

  if (!demoSession.session) {
    return (
      <DemoLogin
        role={demoSession.role}
        identifier={demoSession.identifier}
        password={demoSession.password}
        showPassword={demoSession.showPassword}
        message={demoSession.message}
        messageType={demoSession.messageType}
        identifierLabel={demoSession.identifierLabel}
        identifierPlaceholder={demoSession.identifierPlaceholder}
        onRoleChange={demoSession.changeRole}
        onIdentifierChange={demoSession.setIdentifier}
        onPasswordChange={demoSession.setPassword}
        onPasswordVisibilityToggle={demoSession.togglePasswordVisibility}
        onSubmit={submitLogin}
        onQuickAccess={demoSession.fillQuickAccess}
        onCreateAccount={() => setShowRegister(true)}
      />
    );
  }

  if (demoSession.session.role === "coordinator") {
    const activeAdminView = activeView.startsWith("admin-")
      ? (activeView as AdminView)
      : null;

    if (activeAdminView) {
      const goToAdminView = (view: AdminView) => setActiveView(view);
      let screen: import("react").ReactNode;

      switch (activeAdminView) {
        case "admin-pending":
          screen = isApiMode() ? (
            <PendingRequestsApi
              onAnalyzeRequest={(id) => {
                setSelectedAdminRequestId(id);
                goToAdminView("admin-analysis");
              }}
            />
          ) : (
            <PendingRequestsScreen
              onAnalyzeRequest={(requestId) => {
                setSelectedAdminRequestId(requestId);
                goToAdminView("admin-analysis");
              }}
            />
          );
          break;
        case "admin-analysis":
          screen = isApiMode() ? (
            <RequestAnalysisApi
              requestId={selectedAdminRequestId}
              onBackToPending={() => goToAdminView("admin-pending")}
            />
          ) : (
            <RequestAnalysisScreen
              onBackToPending={() => goToAdminView("admin-pending")}
              onCompleteAnalysis={() => goToAdminView("admin-checkout")}
            />
          );
          break;
        case "admin-checkout":
          screen = (
            <CheckoutOperations
              onCheckoutConfirmed={() => goToAdminView("admin-return")}
            />
          );
          break;
        case "admin-return":
          screen = (
            <ReturnOperations
              onReturnConfirmed={() => goToAdminView("admin-alerts")}
            />
          );
          break;
        case "admin-alerts":
          screen = (
            <OverdueAlertsPage
              onRegisterReturn={() => goToAdminView("admin-return")}
            />
          );
          break;
        case "admin-materials":
          screen = <MaterialsManagement />;
          break;
        case "admin-rooms-keys":
          screen = <RoomsKeysManagement />;
          break;
        case "admin-authorizations":
          screen = <AuthorizationsProjects />;
          break;
        case "admin-history":
          screen = <MovementHistory />;
          break;
      }

      return (
        <AdminWorkspace
          activeView={activeAdminView}
          onBackToDashboard={() => setActiveView("dashboard")}
          onSelectView={goToAdminView}
          selectedRequestId={
            activeAdminView === "admin-analysis" ? selectedAdminRequestId : null
          }
        >
          {screen}
        </AdminWorkspace>
      );
    }

    return (
      <AdminDashboard
        session={demoSession.session.dashboard}
        onLogout={logout}
        onAction={(action) => {
          const actionViews: Partial<Record<string, AdminView>> = {
            requests: "admin-pending",
            "review-requests": "admin-pending",
            operations: "admin-checkout",
            "register-pickup": "admin-checkout",
            "register-return": "admin-return",
            inventory: "admin-materials",
            "manage-inventory": "admin-materials",
            "authorized-users": "admin-authorizations",
            reports: "admin-history",
            refresh: "admin-alerts",
          };
          const view = actionViews[action];
          if (view) setActiveView(view);
        }}
        onViewRequest={(requestId) => {
          // Os cards do painel ainda são demonstrativos; escolha o pedido real na fila.
          setSelectedAdminRequestId(isApiMode() ? null : requestId);
          setActiveView(isApiMode() ? "admin-pending" : "admin-analysis");
        }}
      />
    );
  }

  const session = demoSession.session.dashboard;
  // Mesmos botões extras da barra do topo em todas as telas.
  const navExtras = {
    onLogout: logout,
    onMaterials:
      demoSession.session.role === "professor"
        ? () => setActiveView("professor-materials")
        : undefined,
  };

  if (
    activeView === "professor-materials" &&
    demoSession.session.role === "professor"
  ) {
    return (
      <main className="professor-materials-page">
        <div className="professor-materials-page__bar">
          <button type="button" onClick={() => setActiveView("dashboard")}>
            ← Voltar ao painel
          </button>
        </div>
        <ProfessorMaterialsCatalog />
      </main>
    );
  }

  if (activeView === "new-request") {
    return (
      <NewRequestScreen
        session={session}
        navExtras={navExtras}
        initialDraft={requestForReview?.draft}
        onBack={() => {
          setRequestForReview(null);
          setActiveView("dashboard");
        }}
        onMyRequests={() => setActiveView("my-requests")}
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
        session={session}
        navExtras={navExtras}
        request={requestForReview}
        onBack={() => setActiveView("dashboard")}
        onMyRequests={() => setActiveView("my-requests")}
        onEdit={() => setActiveView("new-request")}
        onConfirm={async () => {
          // No modo mock não há servidor: só simula o envio.
          if (!isApiMode() || !requestForReview.draft) return;
          const created = await createRequest(requestForReview.draft);
          return created.protocol;
        }}
        onSuccess={() => {
          setRequestForReview(null);
          setActiveView("my-requests");
        }}
      />
    );
  }

  if (activeView === "my-requests") {
    return (
      <MyRequestsScreen
        session={session}
        navExtras={navExtras}
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
      <RequestDetailsLoader
        session={session}
        navExtras={navExtras}
        selectedRequest={selectedRequest}
        onBack={() => setActiveView("my-requests")}
        onHome={() => setActiveView("dashboard")}
        onNewRequest={() => setActiveView("new-request")}
      />
    );
  }

  if (demoSession.session.role === "student") {
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
      onMaterials={() => setActiveView("professor-materials")}
      onLogout={logout}
    />
  );
}
