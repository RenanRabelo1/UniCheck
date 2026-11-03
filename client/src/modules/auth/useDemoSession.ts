import { isApiMode } from "../../services/api";
import { loginApi, logoutApi, restoreSession } from "../../services/auth";
import { useEffect, useState } from "react";
import {
  createDemoSession,
  type DemoRole,
  type DemoSession,
  type QuickAccess,
} from "./demoSession";

type LoginMessageType = "error" | "success";

export function useDemoSession() {
  const [role, setRole] = useState<DemoRole>("professor");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<LoginMessageType>("error");
  const [session, setSession] = useState<DemoSession | null>(null);
  // Com token guardado, a tela de login só aparece se ele não valer mais.
  const [restoring, setRestoring] = useState(
    () => isApiMode() && Boolean(sessionStorage.getItem("unicheck_token")),
  );

  useEffect(() => {
    const token = sessionStorage.getItem("unicheck_token");
    if (!isApiMode() || !token) return;
    restoreSession(token)
      .then(setSession)
      .catch(() => sessionStorage.removeItem("unicheck_token"))
      .finally(() => setRestoring(false));
  }, []);

  const isStudent = role === "student";
  // Regra do plano: aluno entra com o e-mail institucional; os demais perfis, com a matrícula.
  const identifierLabel = isStudent ? "E-mail institucional" : "Matrícula";
  const identifierPlaceholder = isStudent ? "seu.email@unifor.br" : "2048819";

  function changeRole(nextRole: DemoRole) {
    setRole(nextRole);
    setIdentifier("");
    setPassword("");
    setMessage("");
  }

  function login(): boolean | Promise<boolean> {
    if (!identifier.trim()) {
      setMessage(`Informe ${identifierLabel.toLowerCase()}.`);
      setMessageType("error");
      return false;
    }

    if (!password.trim()) {
      setMessage("Informe sua senha.");
      setMessageType("error");
      return false;
    }

    if (role === "coordinator" && password.length < 8) {
      setMessage("A senha do Coordenador CCT deve ter no mínimo 8 caracteres.");
      setMessageType("error");
      return false;
    }

    if (isApiMode()) {
      setMessage("Entrando...");
      setMessageType("success");
      return loginApi(identifier.trim(), password, role)
        .then((nextSession) => {
          setSession(nextSession);
          setMessage("");
          return true;
        })
        .catch((error: unknown) => {
          setMessage(
            error instanceof Error ? error.message : "Não foi possível entrar.",
          );
          setMessageType("error");
          return false;
        });
    }
    setSession(createDemoSession(role, identifier));
    return true;
  }

  function fillQuickAccess(item: QuickAccess) {
    setRole(item.role);
    setIdentifier(item.identifier);
    setPassword("");
    setMessage(
      isApiMode()
        ? "Conta de teste preenchida. Informe a senha cadastrada no servidor."
        : "Dados de demonstração preenchidos. Informe uma senha para continuar.",
    );
    setMessageType("success");
  }

  /** Usado pelo cadastro: a conta nova já entra no sistema sem passar pelo login. */
  function startSession(nextSession: DemoSession) {
    setSession(nextSession);
    setIdentifier("");
    setPassword("");
    setMessage("");
  }

  function logout() {
    const token = sessionStorage.getItem("unicheck_token");
    if (isApiMode() && token) void logoutApi(token);
    sessionStorage.removeItem("unicheck_token");
    setSession(null);
    setIdentifier("");
    setPassword("");
    setMessage("Sessão encerrada.");
    setMessageType("success");
  }

  return {
    role,
    identifier,
    password,
    showPassword,
    message,
    messageType,
    session,
    restoring,
    isStudent,
    identifierLabel,
    identifierPlaceholder,
    changeRole,
    setIdentifier,
    setPassword,
    togglePasswordVisibility: () => setShowPassword((current) => !current),
    login,
    startSession,
    fillQuickAccess,
    logout,
  };
}
