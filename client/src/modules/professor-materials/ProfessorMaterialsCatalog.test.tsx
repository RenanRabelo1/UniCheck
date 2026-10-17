// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfessorMaterialsCatalog } from './ProfessorMaterialsCatalog';

describe('ProfessorMaterialsCatalog', () => {
  afterEach(cleanup);

  it('filtra materiais pela busca e categoria', () => {
    render(<ProfessorMaterialsCatalog />);
    fireEvent.change(screen.getByLabelText('Buscar material'), { target: { value: 'projetor' } });
    expect(screen.getByText('Projetor multimídia')).toBeTruthy();
    expect(screen.queryByText('Notebook')).toBeNull();
    fireEvent.change(screen.getByLabelText('Filtrar por categoria'), { target: { value: 'Eletrônicos' } });
    expect(screen.getByText('Nenhum material encontrado.')).toBeTruthy();
  });

  it('permite seleção local e quantidade sem persistência', () => {
    render(<ProfessorMaterialsCatalog />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar material' })[0]);
    expect(screen.getByRole('complementary', { name: 'Seleção atual' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '3' } });
    expect(screen.getByDisplayValue('3')).toBeTruthy();
    expect(screen.getByText(/apenas enquanto a tela estiver aberta/)).toBeTruthy();
  });

  it('devolve uma seleção somente quando o consumidor optar por usá-la', () => {
    const onUseSelection = vi.fn();
    render(<ProfessorMaterialsCatalog onUseSelection={onUseSelection} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar material' })[0]);
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Usar na solicitação demonstrativa' }));

    expect(onUseSelection).toHaveBeenCalledWith({ id: 'notebook', name: 'Notebook', quantity: 2 });
  });
});
