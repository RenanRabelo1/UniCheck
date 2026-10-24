import { isApiMode } from "../../services/api";
import { loginApi } from "../../services/auth";
import { useState } from "react";
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

  const isStudent = role === "student";
  const identifierLabel = isStudent ? "E-mail institucional" : "Matrícula";
  const identifierPlaceholder = isStudent
    ? "seu.email@unifor.br"
    : role === "professor"
      ? "Ex.: 2048819"
      : "Ex.: 18024900";

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

  function logout() {
    sessionStorage.removeItem("unicheck_token");
    setSession(null);
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
    isStudent,
    identifierLabel,
    identifierPlaceholder,
    changeRole,
    setIdentifier,
    setPassword,
    togglePasswordVisibility: () => setShowPassword((current) => !current),
    login,
    fillQuickAccess,
    logout,
  };
}
