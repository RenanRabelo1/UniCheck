import { useEffect, useState } from "react";
import { isApiMode } from "../../services/api";
import { getRequestOptions } from "../../services/requests";
import { requestOptionsMock } from "./requestOptions.mock";
import type { RequestOptions, RequestWindow } from "./types";

const complete = (window: Partial<RequestWindow>): window is RequestWindow =>
  Boolean(
    window.date &&
      window.pickupTime &&
      window.returnTime &&
      window.returnTime > window.pickupTime,
  );

/**
 * Carrega a lista de salas, materiais e chaves. Quando data e horários estão preenchidos,
 * pede de novo ao servidor para saber o que está livre naquele horário (sem piscar a lista:
 * os dados antigos ficam na tela até os novos chegarem).
 */
export function useRequestOptions(window: Partial<RequestWindow>) {
  const [data, setData] = useState<RequestOptions | null>(
    isApiMode() ? null : requestOptionsMock,
  );
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const { date, pickupTime, returnTime } = window;
  const ready = complete({ date, pickupTime, returnTime });

  useEffect(() => {
    if (!isApiMode()) return;
    const controller = new AbortController();
    // Espera um instante: quem digita o horário não dispara uma consulta por tecla.
    const timer = setTimeout(() => {
      getRequestOptions(
        ready ? { date: date!, pickupTime: pickupTime!, returnTime: returnTime! } : undefined,
        controller.signal,
      )
        .then((options) => {
          setData(options);
          setError(null);
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar a lista de itens.",
          );
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [ready, date, pickupTime, returnTime, attempt]);

  return {
    data,
    error,
    loading: data === null && error === null,
    reload: () => setAttempt((current) => current + 1),
  };
}
