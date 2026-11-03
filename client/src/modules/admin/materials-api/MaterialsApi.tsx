import { useRef, useState, type FormEvent, type ReactNode } from "react";

import { useDialogFocus } from "../../../app/useDialogFocus";
import {
  createMaterial,
  listMaterials,
  updateMaterial,
  type Material,
} from "../../../services/materials";
import { useRequestData } from "../../solicitacoes/useRequestData";
import { errorMessage } from "../operations-api/operations.shared";
import "../materials-management/materials-management.css";
import "../requests-api/requestsApi.css";

type StatusFilter = "active" | "inactive" | "all";
type ControlFilter = "all" | Material["control"];
type Dialog =
  | { kind: "create" }
  | { kind: "edit"; material: Material }
  | { kind: "inactivate"; material: Material };

const controlLabel: Record<Material["control"], string> = {
  individual: "Individual",
  quantity: "Por quantidade",
};

function availability(material: Material) {
  if (material.control === "individual")
    return material.inPossession > 0 ? "Retirado" : "Disponível";
  const free = material.totalQuantity - material.inPossession;
  return `${free} de ${material.totalQuantity} disponíveis agora`;
}

/** Tela 13 conectada: materiais são editados ou inativados, nunca removidos. */
export function MaterialsApi() {
  const { data, loading, error, retry } = useRequestData(listMaterials);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [control, setControl] = useState<ControlFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [notice, setNotice] = useState("");
  const [problem, setProblem] = useState("");

  const materials = data ?? [];
  const categories = [
    ...new Set(materials.map((item) => item.category)),
  ].sort();
  const search = query.trim().toLocaleLowerCase("pt-BR");
  const visible = materials.filter(
    (material) =>
      `${material.name} ${material.patrimony ?? ""} ${material.detail ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(search) &&
      (category === "all" || material.category === category) &&
      (control === "all" || material.control === control) &&
      (status === "all" || material.active === (status === "active")),
  );

  function finish(message: string) {
    setDialog(null);
    setNotice(message);
    setProblem("");
    retry();
  }
  async function setActive(material: Material, active: boolean) {
    setNotice("");
    try {
      await updateMaterial(material.id, { active });
      finish(`${material.name} ${active ? "reativado" : "inativado"}.`);
    } catch (cause) {
      setDialog(null);
      setProblem(errorMessage(cause, "Não foi possível alterar o material."));
    }
  }

  return (
    <section
      className="materials-management"
      aria-labelledby="materials-management-title"
    >
      <header className="materials-management__header">
        <div>
          <p className="materials-management__eyebrow">Administração</p>
          <h1 id="materials-management-title">Gerenciamento de materiais</h1>
          <p>Consulte o inventário e mantenha o cadastro atualizado.</p>
        </div>
        <button
          type="button"
          className="materials-management__primary-button"
          onClick={() => setDialog({ kind: "create" })}
        >
          Cadastrar material
        </button>
      </header>

      <div
        className="materials-management__filters"
        aria-label="Filtros de materiais"
      >
        <label>
          Buscar inventário
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, detalhe ou patrimônio"
          />
        </label>
        <label>
          Filtrar categoria
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">Todas</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Modalidade
          <select
            value={control}
            onChange={(event) =>
              setControl(event.target.value as ControlFilter)
            }
          >
            <option value="all">Todas</option>
            <option value="individual">Individual</option>
            <option value="quantity">Por quantidade</option>
          </select>
        </label>
        <label>
          Situação
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
          >
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="all">Todos</option>
          </select>
        </label>
      </div>

      {notice && (
        <p className="admin-api-success" role="status">
          {notice}
        </p>
      )}
      {problem && (
        <p className="admin-api-error" role="alert">
          {problem}
        </p>
      )}
      {loading && <p role="status">Carregando materiais…</p>}
      {error && (
        <div className="admin-api-error" role="alert">
          <p>{error}</p>
          <button className="admin-api-button" type="button" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="materials-management__summary" aria-live="polite">
            {visible.length}{" "}
            {visible.length === 1
              ? "material encontrado"
              : "materiais encontrados"}
          </div>
          <div className="materials-management__table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Categoria</th>
                  <th>Controle</th>
                  <th>Disponibilidade</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((material) => (
                  <tr key={material.id}>
                    <td>
                      <strong>{material.name}</strong>
                      <span>
                        {[material.patrimony, material.detail]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </td>
                    <td>{material.category}</td>
                    <td>{controlLabel[material.control]}</td>
                    <td>{availability(material)}</td>
                    <td>
                      <span
                        className={`materials-management__status materials-management__status--${material.active ? "active" : "inactive"}`}
                      >
                        {material.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="materials-management__table-button"
                        onClick={() => setDialog({ kind: "edit", material })}
                      >
                        Editar
                      </button>{" "}
                      <button
                        type="button"
                        className="materials-management__table-button"
                        onClick={() =>
                          material.active
                            ? setDialog({ kind: "inactivate", material })
                            : void setActive(material, true)
                        }
                      >
                        {material.active ? "Inativar" : "Reativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && (
              <p className="materials-management__empty">
                Nenhum material corresponde aos filtros atuais.
              </p>
            )}
          </div>
        </>
      )}

      {dialog?.kind === "create" && (
        <Modal title="Cadastrar material" onClose={() => setDialog(null)}>
          <MaterialForm
            onCancel={() => setDialog(null)}
            onSaved={(name) => finish(`${name} cadastrado.`)}
          />
        </Modal>
      )}
      {dialog?.kind === "edit" && (
        <Modal title="Editar material" onClose={() => setDialog(null)}>
          <MaterialForm
            material={dialog.material}
            onCancel={() => setDialog(null)}
            onSaved={(name) => finish(`${name} atualizado.`)}
          />
        </Modal>
      )}
      {dialog?.kind === "inactivate" && (
        <Modal title="Confirmar inativação" onClose={() => setDialog(null)}>
          <p>
            Deseja inativar <strong>{dialog.material.name}</strong>?
          </p>
          <p className="materials-management__warning">
            Esta ação não exclui o material: o histórico de empréstimos é
            preservado e ele deixa de aceitar novas solicitações.
          </p>
          <div className="materials-management__modal-actions">
            <button
              type="button"
              className="materials-management__secondary-button"
              onClick={() => setDialog(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="materials-management__danger-button"
              onClick={() => void setActive(dialog.material, false)}
            >
              Confirmar inativação
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function MaterialForm({
  material,
  onCancel,
  onSaved,
}: {
  material?: Material;
  onCancel: () => void;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(material?.name ?? "");
  const [category, setCategory] = useState(material?.category ?? "");
  const [control, setControl] = useState<Material["control"]>(
    material?.control ?? "quantity",
  );
  const [patrimony, setPatrimony] = useState(material?.patrimony ?? "");
  const [quantity, setQuantity] = useState(material?.totalQuantity ?? 1);
  const [detail, setDetail] = useState(material?.detail ?? "");
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");
  const locked = useRef(false);
  const individual = control === "individual";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    setProblem("");
    const fields = {
      name: name.trim(),
      category: category.trim(),
      totalQuantity: individual ? 1 : quantity,
      ...(individual ? { patrimony: patrimony.trim() } : {}),
    };
    const typedDetail = detail.trim();
    try {
      if (material) {
        await updateMaterial(material.id, { ...fields, detail: typedDetail });
      } else {
        await createMaterial({
          ...fields,
          control,
          ...(typedDetail ? { detail: typedDetail } : {}),
        });
      }
      onSaved(fields.name);
    } catch (cause) {
      setProblem(errorMessage(cause, "Não foi possível salvar o material."));
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }

  return (
    <form className="materials-management__form" onSubmit={submit}>
      <label>
        Nome
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Categoria
        <input
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </label>
      {!material && (
        <fieldset>
          <legend>Modalidade de controle</legend>
          <label>
            <input
              type="radio"
              checked={individual}
              onChange={() => setControl("individual")}
            />{" "}
            Individual
          </label>
          <label>
            <input
              type="radio"
              checked={!individual}
              onChange={() => setControl("quantity")}
            />{" "}
            Por quantidade
          </label>
        </fieldset>
      )}
      {individual ? (
        <label>
          Patrimônio
          <input
            required
            value={patrimony}
            onChange={(event) => setPatrimony(event.target.value)}
          />
        </label>
      ) : (
        <label>
          Quantidade total
          <input
            required
            min="1"
            max="1000"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </label>
      )}
      <label>
        Detalhe (opcional)
        <input
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
        />
      </label>
      {problem && (
        <p className="admin-api-error" role="alert">
          {problem}
        </p>
      )}
      <div className="materials-management__modal-actions">
        <button
          type="button"
          className="materials-management__secondary-button"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="materials-management__primary-button"
          disabled={saving}
        >
          Salvar
        </button>
      </div>
    </form>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  return (
    <div className="materials-management__backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="materials-management__modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
