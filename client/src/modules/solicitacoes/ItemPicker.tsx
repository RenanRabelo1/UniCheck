import { useMemo, useState } from "react";
import type { CatalogItem } from "./types";
import "./ItemPicker.css";

/** Chave única de um item: materiais e chaves podem ter o mesmo número no banco. */
export const itemKey = (item: Pick<CatalogItem, "type" | "id">) =>
  `${item.type}:${item.id}`;

const MAX_QUANTITY = 10;

type ItemPickerProps = {
  items: CatalogItem[];
  /** Quantidade escolhida de cada item (só entram os itens marcados). */
  selected: Record<string, number>;
  /** Sala já escolhida: chaves de outras salas ficam indisponíveis. */
  roomId: string;
  /** Com data e horários preenchidos, "disponível" passa a significar "livre nesse horário". */
  hasWindow: boolean;
  onToggle: (item: CatalogItem) => void;
  onQuantityChange: (item: CatalogItem, quantity: number) => void;
};

type Filter = "all" | "material" | "key";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "material", label: "Materiais" },
  { id: "key", label: "Chaves" },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-BR");
}

/** Por que o item não pode ser marcado agora (ou null se pode). */
export function unavailableReason(
  item: CatalogItem,
  roomId: string,
  hasWindow: boolean,
): string | null {
  if (item.locked) return item.lockedReason ?? "Bloqueado para o seu perfil.";
  if (item.type === "key" && roomId && item.roomId !== roomId) {
    return "Chave de outra sala";
  }
  if (item.available <= 0) {
    return hasWindow ? "Indisponível nesse horário" : "Sem estoque";
  }
  return null;
}

function availabilityLabel(item: CatalogItem, hasWindow: boolean) {
  if (item.type === "key") return hasWindow ? "Livre nesse horário" : "Chave";
  const unit = item.available === 1 ? "unidade" : "unidades";
  return hasWindow
    ? `${item.available} ${unit} livre${item.available === 1 ? "" : "s"}`
    : `${item.total} em estoque`;
}

export function ItemPicker({
  items,
  selected,
  roomId,
  hasWindow,
  onToggle,
  onQuantityChange,
}: ItemPickerProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const search = normalize(query.trim());
    return items.filter(
      (item) =>
        (filter === "all" || item.type === filter) &&
        (!search ||
          normalize(`${item.name} ${item.detail ?? ""}`).includes(search)),
    );
  }, [items, query, filter]);

  const chosen = items.filter((item) => selected[itemKey(item)]);

  return (
    <div className="item-picker">
      <div className="item-picker__tools">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar item (ex.: projetor, chave, pincel)"
          aria-label="Buscar item"
        />
        <div className="item-picker__filters" role="group" aria-label="Tipo de item">
          {filters.map((option) => (
            <button
              key={option.id}
              type="button"
              className={filter === option.id ? "active" : undefined}
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="item-picker__empty">
          Nenhum item encontrado para essa busca.
        </p>
      ) : (
        <ul className="item-picker__grid" aria-label="Itens disponíveis para solicitar">
          {visible.map((item) => {
            const key = itemKey(item);
            const quantity = selected[key] ?? 0;
            const isSelected = quantity > 0;
            const reason = unavailableReason(item, roomId, hasWindow);
            const disabled = Boolean(reason) && !isSelected;
            const max = Math.min(MAX_QUANTITY, Math.max(1, item.available));

            return (
              <li key={key}>
                <div
                  className={`item-card${isSelected ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={item.name}
                    disabled={disabled}
                    className="item-card__main"
                    onClick={() => onToggle(item)}
                  >
                    <span className="item-card__icon" aria-hidden="true">
                      {item.type === "key" ? "⚿" : "▣"}
                    </span>
                    <span className="item-card__copy">
                      <strong>{item.name}</strong>
                      {item.detail && <small>{item.detail}</small>}
                      <em className={reason ? "is-warning" : undefined}>
                        {reason ?? availabilityLabel(item, hasWindow)}
                      </em>
                    </span>
                    <span className="item-card__check" aria-hidden="true">
                      {isSelected ? "✓" : ""}
                    </span>
                  </button>

                  {isSelected && item.type === "material" && (
                    <div className="item-card__quantity">
                      <span id={`${key}-qty`}>Quantidade</span>
                      <div role="group" aria-labelledby={`${key}-qty`}>
                        <button
                          type="button"
                          aria-label={`Diminuir quantidade de ${item.name}`}
                          disabled={quantity <= 1}
                          onClick={() => onQuantityChange(item, quantity - 1)}
                        >
                          −
                        </button>
                        <output aria-live="polite">{quantity}</output>
                        <button
                          type="button"
                          aria-label={`Aumentar quantidade de ${item.name}`}
                          disabled={quantity >= max}
                          onClick={() => onQuantityChange(item, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="item-picker__summary" aria-live="polite">
        <strong>
          {chosen.length === 0
            ? "Nenhum item escolhido ainda"
            : `${chosen.length} ${chosen.length === 1 ? "item escolhido" : "itens escolhidos"}`}
        </strong>
        {chosen.length > 0 && (
          <ul>
            {chosen.map((item) => (
              <li key={itemKey(item)}>
                <span>
                  {item.name}
                  {item.type === "material" && ` × ${selected[itemKey(item)]}`}
                </span>
                <button
                  type="button"
                  aria-label={`Remover ${item.name}`}
                  onClick={() => onToggle(item)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
