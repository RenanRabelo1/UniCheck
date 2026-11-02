export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export const isApiMode = () => import.meta.env.VITE_DATA_SOURCE === "api";

async function requestJson<T>(
  path: string,
  options: RequestInit,
  token?: string,
): Promise<T> {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (!apiUrl) throw new ApiError("A URL da API não foi configurada.");
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique se o back-end está em execução.",
    );
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    const message =
      response.status === 401 && path !== "/auth/login"
        ? "Sessão expirada ou inválida. Saia e entre novamente."
        : (body?.message ?? "Não foi possível carregar os dados.");
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}
export const getJson = <T>(
  path: string,
  token?: string,
  signal?: AbortSignal,
) => requestJson<T>(path, { signal }, token);
export const postJson = <T>(path: string, body: unknown, token?: string) =>
  requestJson<T>(path, { method: "POST", body: JSON.stringify(body) }, token);
export const patchJson = <T>(path: string, body: unknown, token?: string) =>
  requestJson<T>(path, { method: "PATCH", body: JSON.stringify(body) }, token);

/** Token da sessão atual; sem ele, a chamada nem chega ao servidor. */
export function sessionToken(): string {
  const value = sessionStorage.getItem("unicheck_token");
  if (!value) throw new ApiError("Entre novamente para continuar.", 401);
  return value;
}

/** Confere a resposta do servidor contra o contrato esperado pela tela. */
export function parseResponse<T>(
  schema: { safeParse: (value: unknown) => { success: boolean; data?: T } },
  value: unknown,
): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ApiError(
      "O servidor retornou dados incompatíveis. Atualize a página e confira a versão do servidor.",
    );
  return result.data as T;
}
