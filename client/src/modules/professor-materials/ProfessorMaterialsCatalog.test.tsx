import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfessorMaterialsCatalog } from './ProfessorMaterialsCatalog';

describe('ProfessorMaterialsCatalog', () => {
  it('filtra materiais pela busca e categoria', () => {
    render(<ProfessorMaterialsCatalog />);
    fireEvent.change(screen.getByLabelText('Buscar material'), { target: { value: 'projetor' } });
    expect(screen.getByText('Projetor multimídia')).toBeInTheDocument();
    expect(screen.queryByText('Notebook')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Filtrar por categoria'), { target: { value: 'Eletrônicos' } });
    expect(screen.getByText('Nenhum material encontrado.')).toBeInTheDocument();
  });

  it('permite seleção local e quantidade sem persistência', () => {
    render(<ProfessorMaterialsCatalog />);
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar material' }));
    expect(screen.getByRole('complementary', { name: 'Seleção atual' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '3' } });
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByText(/apenas enquanto a tela estiver aberta/)).toBeInTheDocument();
  });
});
