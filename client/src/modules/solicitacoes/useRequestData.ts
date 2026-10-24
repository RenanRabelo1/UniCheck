import { useEffect, useState } from "react";
export function useRequestData<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    loader?: typeof load;
    attempt?: number;
    data?: T;
    error?: string;
  }>({});
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ loader: load, attempt, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            loader: load,
            attempt,
            error:
              error instanceof Error
                ? error.message
                : "Não foi possível carregar as solicitações.",
          });
      });
    return () => controller.abort();
  }, [load, attempt]);
  const loading = state.loader !== load || state.attempt !== attempt;
  return {
    data: loading ? undefined : state.data,
    error: loading ? undefined : state.error,
    loading,
    retry: () => setAttempt((value) => value + 1),
  };
}
