import { getRequestOptions } from "../../services/requests";
import { useRequestData } from "../solicitacoes/useRequestData";
import {
  ProfessorMaterialsCatalog,
  type CatalogMaterial,
} from "./ProfessorMaterialsCatalog";

const loadOptions = (signal: AbortSignal) =>
  getRequestOptions(undefined, signal);

/** Catálogo com o cadastro real. A disponibilidade por horário é conferida na Nova solicitação. */
export function ProfessorMaterialsApi({
  onNewRequest,
}: {
  onNewRequest: () => void;
}) {
  const { data, loading, error, retry } = useRequestData(loadOptions);

  if (loading) return <p role="status">Carregando materiais…</p>;
  if (error || !data)
    return (
      <div role="alert">
        <p>{error ?? "Não foi possível carregar os materiais."}</p>
        <button type="button" onClick={retry}>
          Tentar novamente
        </button>
      </div>
    );

  const materials: CatalogMaterial[] = data.items
    .filter((item) => item.type === "material")
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category ?? "Geral",
      description: item.detail ?? "",
      available: item.total,
      unit: item.total === 1 ? "unidade" : "unidades",
    }));

  return (
    <ProfessorMaterialsCatalog
      materials={materials}
      onNewRequest={onNewRequest}
    />
  );
}
