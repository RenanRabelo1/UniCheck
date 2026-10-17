import { useMemo, useState } from 'react';

type MaterialCategory = 'Todos' | 'Eletrônicos' | 'Apoio' | 'Audiovisual';

type Material = {
  id: string;
  name: string;
  category: Exclude<MaterialCategory, 'Todos'>;
  description: string;
  available: number;
  unit: string;
};

export type ProfessorMaterialSelection = Pick<Material, "id" | "name"> & {
  quantity: number;
};

type ProfessorMaterialsCatalogProps = {
  onUseSelection?: (selection: ProfessorMaterialSelection) => void;
};

const materials: Material[] = [
  { id: 'notebook', name: 'Notebook', category: 'Eletrônicos', description: 'Notebook para atividades em sala ou laboratório.', available: 8, unit: 'unidades' },
  { id: 'projector', name: 'Projetor multimídia', category: 'Audiovisual', description: 'Projetor com cabo HDMI para apresentações.', available: 2, unit: 'unidades' },
  { id: 'extension', name: 'Extensão elétrica', category: 'Apoio', description: 'Extensão de 10 metros para apoio à aula.', available: 12, unit: 'unidades' },
  { id: 'webcam', name: 'Webcam', category: 'Eletrônicos', description: 'Webcam USB para gravações e aulas híbridas.', available: 0, unit: 'unidades' },
];

const categories: MaterialCategory[] = ['Todos', 'Eletrônicos', 'Apoio', 'Audiovisual'];

export function ProfessorMaterialsCatalog({
  onUseSelection,
}: ProfessorMaterialsCatalogProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('Todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const filteredMaterials = useMemo(() => materials.filter((material) => {
    const matchesQuery = `${material.name} ${material.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'Todos' || material.category === category;
    return matchesQuery && matchesCategory;
  }), [category, query]);

  const selectedMaterial = materials.find((material) => material.id === selectedId);

  function selectMaterial(material: Material) {
    setSelectedId(material.id);
    setQuantity(1);
  }

  return (
    <section aria-labelledby="professor-materials-title" style={{ maxWidth: 1100, margin: '0 auto', padding: 24, color: '#172033' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <p style={{ margin: '0 0 6px', color: '#53627a', fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Professor</p>
          <h1 id="professor-materials-title" style={{ margin: 0, fontSize: 28 }}>Materiais disponíveis</h1>
          <p style={{ margin: '8px 0 0', color: '#53627a' }}>Consulte o catálogo e monte sua seleção para a próxima solicitação.</p>
        </div>
        <div role="status" style={{ maxWidth: 330, padding: '10px 14px', borderRadius: 10, background: '#fff7df', color: '#795d09', fontSize: 13 }}>
          Seleção demonstrativa: não há reserva, envio ou persistência nesta tela.
        </div>
      </header>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <label style={{ flex: '1 1 280px' }}>
          <span style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700 }}>Buscar material</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou descrição" aria-label="Buscar material" style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', border: '1px solid #cbd3df', borderRadius: 8 }} />
        </label>
        <label style={{ flex: '0 1 220px' }}>
          <span style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700 }}>Categoria</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as MaterialCategory)} aria-label="Filtrar por categoria" style={{ width: '100%', padding: '11px 12px', border: '1px solid #cbd3df', borderRadius: 8, background: 'white' }}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {filteredMaterials.length === 0 ? <p>Nenhum material encontrado.</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {filteredMaterials.map((material) => {
          const isSelected = material.id === selectedId;
          return <article key={material.id} style={{ border: `1px solid ${isSelected ? '#3867d6' : '#dce2eb'}`, borderRadius: 12, padding: 18, background: isSelected ? '#f3f7ff' : 'white', boxShadow: '0 2px 8px rgba(23,32,51,.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}><h2 style={{ margin: 0, fontSize: 18 }}>{material.name}</h2><span style={{ color: material.available > 0 ? '#176b4d' : '#a33d3d', fontSize: 12, fontWeight: 700 }}>{material.available > 0 ? 'Disponível' : 'Indisponível'}</span></div>
            <p style={{ minHeight: 42, color: '#53627a', fontSize: 14, lineHeight: 1.45 }}>{material.description}</p>
            <p style={{ margin: '0 0 16px', fontSize: 14 }}><strong>{material.available}</strong> {material.unit}</p>
            <button type="button" disabled={material.available === 0} onClick={() => selectMaterial(material)} style={{ width: '100%', padding: '10px 12px', border: 0, borderRadius: 8, background: material.available === 0 ? '#e8ebf0' : '#3867d6', color: material.available === 0 ? '#778196' : 'white', cursor: material.available === 0 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>{isSelected ? 'Material selecionado' : 'Selecionar material'}</button>
          </article>;
        })}
      </div>}

      {selectedMaterial && <aside aria-label="Seleção atual" style={{ marginTop: 24, padding: 18, borderRadius: 12, background: '#edf3ff', border: '1px solid #c8d7fb' }}>
        <strong>{selectedMaterial.name}</strong>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginLeft: 24 }}>Quantidade
          <input type="number" min="1" max={selectedMaterial.available} value={quantity} onChange={(event) => setQuantity(Math.min(selectedMaterial.available, Math.max(1, Number(event.target.value) || 1)))} aria-label="Quantidade" style={{ width: 70, padding: 8, border: '1px solid #abbfe9', borderRadius: 6 }} />
        </label>
        <span style={{ display: 'block', marginTop: 10, color: '#53627a', fontSize: 13 }}>Esta seleção existe apenas enquanto a tela estiver aberta.</span>
        {onUseSelection && (
          <button
            type="button"
            onClick={() => onUseSelection({ id: selectedMaterial.id, name: selectedMaterial.name, quantity })}
            style={{ marginTop: 14, padding: '10px 14px', border: 0, borderRadius: 8, background: '#3867d6', color: 'white', cursor: 'pointer', fontWeight: 700 }}
          >
            Usar na solicitação demonstrativa
          </button>
        )}
      </aside>}
    </section>
  );
}

export default ProfessorMaterialsCatalog;
