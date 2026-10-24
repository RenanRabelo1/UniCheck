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
export const postJson = <T>(path: string, body: unknown) =>
  requestJson<T>(path, { method: "POST", body: JSON.stringify(body) });
