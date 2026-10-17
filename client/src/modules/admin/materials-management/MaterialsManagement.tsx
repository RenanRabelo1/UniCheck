import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { materialCategories, materialMock } from './materials-management.mock';
import type {
  Material,
  MaterialControlMode,
  MaterialFormData,
  MaterialStatus,
} from './materials-management.types';
import './materials-management.css';

const emptyForm: MaterialFormData = {
  name: '',
  category: materialCategories[0],
  controlMode: 'INDIVIDUAL',
  patrimony: '',
  quantity: 1,
  location: '',
  description: '',
};

const controlModeLabel: Record<MaterialControlMode, string> = {
  INDIVIDUAL: 'Individual',
  QUANTITY: 'Por quantidade',
};

const statusLabel: Record<MaterialStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
};

export interface MaterialsManagementProps {
  initialMaterials?: Material[];
  onMaterialCreated?: (material: Material) => void;
  onMaterialInactivated?: (material: Material) => void;
}

export function MaterialsManagement({
  initialMaterials = materialMock,
  onMaterialCreated,
  onMaterialInactivated,
}: MaterialsManagementProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [controlMode, setControlMode] = useState<'ALL' | MaterialControlMode>('ALL');
  const [status, setStatus] = useState<'ALL' | MaterialStatus>('ACTIVE');
  const [location, setLocation] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MaterialFormData>(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingInactivationId, setPendingInactivationId] = useState<string | null>(null);

  const filteredMaterials = useMemo(
    () =>
      materials.filter((material) => {
        const searchable = `${material.name} ${material.id} ${material.patrimony ?? ''}`.toLowerCase();
        return (
          searchable.includes(query.trim().toLowerCase()) &&
          (category === 'ALL' || material.category === category) &&
          (controlMode === 'ALL' || material.controlMode === controlMode) &&
          (status === 'ALL' || material.status === status) &&
          material.location.toLowerCase().includes(location.trim().toLowerCase())
        );
      }),
    [category, controlMode, location, materials, query, status],
  );

  const selectedMaterial = materials.find((material) => material.id === selectedId) ?? null;
  const pendingInactivation = materials.find((material) => material.id === pendingInactivationId) ?? null;

  function resetFilters() {
    setQuery('');
    setCategory('ALL');
    setControlMode('ALL');
    setStatus('ACTIVE');
    setLocation('');
  }

  function closeForm() {
    setForm(emptyForm);
    setShowForm(false);
  }

  function createMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const material: Material = {
      id: `MAT-${String(materials.length + 1).padStart(3, '0')}`,
      name: form.name.trim(),
      category: form.category,
      controlMode: form.controlMode,
      patrimony: form.controlMode === 'INDIVIDUAL' ? form.patrimony.trim() || undefined : undefined,
      quantity: form.controlMode === 'INDIVIDUAL' ? 1 : Number(form.quantity),
      availableQuantity: form.controlMode === 'INDIVIDUAL' ? 1 : Number(form.quantity),
      location: form.location.trim(),
      status: 'ACTIVE',
      description: form.description.trim(),
    };

    setMaterials((current) => [material, ...current]);
    onMaterialCreated?.(material);
    closeForm();
  }

  function confirmInactivation() {
    if (!pendingInactivation) return;

    const inactivated = { ...pendingInactivation, status: 'INACTIVE' as const };
    setMaterials((current) =>
      current.map((material) => (material.id === inactivated.id ? inactivated : material)),
    );
    onMaterialInactivated?.(inactivated);
    setPendingInactivationId(null);
    setSelectedId(null);
  }

  return (
    <section className="materials-management" aria-labelledby="materials-management-title">
      <header className="materials-management__header">
        <div>
          <p className="materials-management__eyebrow">Administração</p>
          <h1 id="materials-management-title">Gerenciamento de materiais</h1>
          <p>Consulte o inventário e mantenha materiais disponíveis para empréstimo.</p>
        </div>
        <button type="button" className="materials-management__primary-button" onClick={() => setShowForm(true)}>
          Cadastrar material
        </button>
      </header>

      <div className="materials-management__filters" aria-label="Filtros de materiais">
        <label>
          Buscar inventário
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, código ou patrimônio"
          />
        </label>
        <label>
          Categoria
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="ALL">Todas</option>
            {materialCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Modalidade
          <select value={controlMode} onChange={(event) => setControlMode(event.target.value as 'ALL' | MaterialControlMode)}>
            <option value="ALL">Todas</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="QUANTITY">Por quantidade</option>
          </select>
        </label>
        <button type="button" className="materials-management__text-button" onClick={() => setShowAdvancedFilters((open) => !open)}>
          {showAdvancedFilters ? 'Ocultar filtros' : 'Filtros avançados'}
        </button>
      </div>

      {showAdvancedFilters && (
        <div className="materials-management__advanced-filters">
          <label>
            Situação
            <select value={status} onChange={(event) => setStatus(event.target.value as 'ALL' | MaterialStatus)}>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="ALL">Todos</option>
            </select>
          </label>
          <label>
            Localização
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ex.: Almoxarifado" />
          </label>
          <button type="button" className="materials-management__text-button" onClick={resetFilters}>Limpar filtros</button>
        </div>
      )}

      <div className="materials-management__summary" aria-live="polite">
        {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material encontrado' : 'materiais encontrados'}
      </div>

      <div className="materials-management__table-wrapper">
        <table>
          <thead>
            <tr><th>Material</th><th>Categoria</th><th>Controle</th><th>Disponibilidade</th><th>Situação</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {filteredMaterials.map((material) => (
              <tr key={material.id}>
                <td><strong>{material.name}</strong><span>{material.id}{material.patrimony ? ` · ${material.patrimony}` : ''}</span></td>
                <td>{material.category}</td>
                <td>{controlModeLabel[material.controlMode]}</td>
                <td>{material.availableQuantity} de {material.quantity}</td>
                <td><span className={`materials-management__status materials-management__status--${material.status.toLowerCase()}`}>{statusLabel[material.status]}</span></td>
                <td><button type="button" className="materials-management__table-button" onClick={() => setSelectedId(material.id)}>Detalhes</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMaterials.length === 0 && <p className="materials-management__empty">Nenhum material corresponde aos filtros atuais.</p>}
      </div>

      {showForm && (
        <Modal title="Cadastrar material" onClose={closeForm}>
          <form className="materials-management__form" onSubmit={createMaterial}>
            <label>Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Categoria<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{materialCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <fieldset><legend>Modalidade de controle</legend><label><input type="radio" checked={form.controlMode === 'INDIVIDUAL'} onChange={() => setForm({ ...form, controlMode: 'INDIVIDUAL', quantity: 1 })} /> Individual</label><label><input type="radio" checked={form.controlMode === 'QUANTITY'} onChange={() => setForm({ ...form, controlMode: 'QUANTITY' })} /> Por quantidade</label></fieldset>
            {form.controlMode === 'INDIVIDUAL' ? <label>Patrimônio<input value={form.patrimony} onChange={(event) => setForm({ ...form, patrimony: event.target.value })} placeholder="Opcional" /></label> : <label>Quantidade<input required min="1" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></label>}
            <label>Localização<input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
            <label>Descrição<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <div className="materials-management__modal-actions"><button type="button" className="materials-management__secondary-button" onClick={closeForm}>Cancelar</button><button type="submit" className="materials-management__primary-button">Cadastrar visualmente</button></div>
          </form>
        </Modal>
      )}

      {selectedMaterial && (
        <Modal title="Detalhes do material" onClose={() => setSelectedId(null)}>
          <dl className="materials-management__details">
            <div><dt>Código</dt><dd>{selectedMaterial.id}</dd></div><div><dt>Categoria</dt><dd>{selectedMaterial.category}</dd></div><div><dt>Controle</dt><dd>{controlModeLabel[selectedMaterial.controlMode]}</dd></div><div><dt>Disponibilidade</dt><dd>{selectedMaterial.availableQuantity} de {selectedMaterial.quantity}</dd></div><div><dt>Localização</dt><dd>{selectedMaterial.location}</dd></div>{selectedMaterial.patrimony && <div><dt>Patrimônio</dt><dd>{selectedMaterial.patrimony}</dd></div>}<div><dt>Descrição</dt><dd>{selectedMaterial.description}</dd></div>
          </dl>
          {selectedMaterial.status === 'ACTIVE' && <div className="materials-management__modal-actions"><button type="button" className="materials-management__danger-button" onClick={() => setPendingInactivationId(selectedMaterial.id)}>Inativar material</button></div>}
        </Modal>
      )}

      {pendingInactivation && (
        <Modal title="Confirmar inativação" onClose={() => setPendingInactivationId(null)}>
          <p>Deseja inativar <strong>{pendingInactivation.name}</strong>?</p>
          <p className="materials-management__warning">Esta ação não exclui o material: o histórico de empréstimos será preservado e ele deixará de estar disponível.</p>
          <div className="materials-management__modal-actions"><button type="button" className="materials-management__secondary-button" onClick={() => setPendingInactivationId(null)}>Cancelar</button><button type="button" className="materials-management__danger-button" onClick={confirmInactivation}>Confirmar inativação</button></div>
        </Modal>
      )}
    </section>
  );
}

interface ModalProps { title: string; children: ReactNode; onClose: () => void; }

function Modal({ title, children, onClose }: ModalProps) {
  return <div className="materials-management__backdrop" role="presentation"><section className="materials-management__modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button type="button" aria-label="Fechar" onClick={onClose}>×</button></header>{children}</section></div>;
}
