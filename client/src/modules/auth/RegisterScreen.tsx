import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { isApiMode } from "../../services/api";
import { registerApi } from "../../services/auth";
import { createRegisteredSession, demoRoles, type DemoSession } from "./demoSession";
import {
  detailFieldByRole,
  registerFormSchema,
  type RegisterFormValues,
} from "./registerSchema";
import "./register.css";

type RegisterScreenProps = {
  onBackToLogin: () => void;
  onRegistered: (session: DemoSession) => void;
};

export function RegisterScreen({
  onBackToLogin,
  onRegistered,
}: RegisterScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register: field,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: "onTouched",
    defaultValues: {
      role: "student",
      name: "",
      email: "",
      registration: "",
      phone: "",
      detail: "",
      password: "",
      confirmPassword: "",
    },
  });

  const role = watch("role");
  const detailField = detailFieldByRole[role];

  const submit = handleSubmit(async (values) => {
    setSubmitError("");
    const data = {
      role: values.role,
      name: values.name,
      email: values.email,
      registration: values.registration,
      phone: values.phone || undefined,
      detail: values.detail,
      password: values.password,
    };

    try {
      // Sem API (modo demonstração) a conta existe só na memória.
      const session = isApiMode()
        ? await registerApi(data)
        : createRegisteredSession(data);
      onRegistered(session);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a conta.",
      );
    }
  });

  function errorOf(name: keyof RegisterFormValues) {
    const message = errors[name]?.message;
    return message ? (
      <small id={`${name}-error`} className="field-error" role="alert">
        {message}
      </small>
    ) : null;
  }

  function describedBy(name: keyof RegisterFormValues) {
    return errors[name] ? `${name}-error` : undefined;
  }

  return (
    <main className="login-page">
      <div className="glow glow-top" />
      <div className="glow glow-bottom" />
      <section className="login-card" aria-label="Cadastro no sistema UniCheck">
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
            <h1>Criar conta</h1>
            <p>Escolha seu perfil e preencha os dados</p>
          </div>

          <div className="role-tabs" role="tablist" aria-label="Perfil da conta">
            {demoRoles.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={role === item.id}
                className={role === item.id ? "active" : ""}
                onClick={() => {
                  setValue("role", item.id);
                  setValue("detail", "");
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} noValidate>
            <label htmlFor="name">Nome completo</label>
            <input
              id="name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy("name")}
              {...field("name")}
            />
            {errorOf("name")}

            <label htmlFor="email">E-mail institucional</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu.email@unifor.br"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy("email")}
              {...field("email")}
            />
            {errorOf("email")}

            <div className="register-grid">
              <div>
                <label htmlFor="registration">Matrícula</label>
                <input
                  id="registration"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.registration)}
                  aria-describedby={describedBy("registration")}
                  {...field("registration")}
                />
                {errorOf("registration")}
              </div>
              <div>
                <label htmlFor="phone">
                  Contato <small>(opcional)</small>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(85) 99999-9999"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={describedBy("phone")}
                  {...field("phone")}
                />
                {errorOf("phone")}
              </div>
            </div>

            <label htmlFor="detail">{detailField.label}</label>
            <input
              id="detail"
              placeholder={detailField.placeholder}
              aria-invalid={Boolean(errors.detail)}
              aria-describedby={describedBy("detail")}
              {...field("detail")}
            />
            {errorOf("detail")}

            <div className="register-grid">
              <div>
                <label htmlFor="password">
                  Senha{" "}
                  <small>(8+ caracteres, 1 maiúscula, 1 especial)</small>
                </label>
                <div className="password-field">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={describedBy("password")}
                    {...field("password")}
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
                {errorOf("password")}
              </div>
              <div>
                <label htmlFor="confirmPassword">Confirmar senha</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={describedBy("confirmPassword")}
                  {...field("confirmPassword")}
                />
                {errorOf("confirmPassword")}
              </div>
            </div>

            {submitError && (
              <p className="form-message error" role="alert">
                {submitError}
              </p>
            )}

            <button
              className="submit-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Criando conta..." : "Criar conta"}{" "}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="auth-switch">
            Já tem conta?{" "}
            <button type="button" className="link-button" onClick={onBackToLogin}>
              Voltar ao login
            </button>
          </p>
        </div>

        <aside className="info-panel">
          <div className="blue-pattern" aria-hidden="true" />
          <div className="info-content">
            <h2>Seu acesso ao CCT em poucos passos.</h2>
            <p>
              Depois de criar a conta você já entra no sistema. Alunos precisam
              de autorização do coordenador para solicitar chaves de salas.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
