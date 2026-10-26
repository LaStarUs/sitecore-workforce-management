import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { authenticate } from './auth/permissions';
import { MemoryRepository } from './data/repository';

beforeEach(() => {
  window.location.hash = '';
});

describe('sign-in', () => {
  it('lets a visitor in with one click on a demo account', async () => {
    render(<App repository={new MemoryRepository()} initialUser={null} />);
    await userEvent.click(screen.getByRole('button', { name: /continue as demo administrator/i }));
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
  });

  it('explains what to do after a wrong password', async () => {
    render(<App repository={new MemoryRepository()} initialUser={null} />);
    await userEvent.type(screen.getByLabelText('Username'), 'admin');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/use one of the accounts below/i);
  });
});

describe('roles', () => {
  it('hides contact details from guests', async () => {
    render(<App repository={new MemoryRepository()} initialUser={authenticate('guest', 'demo1234')} />);
    await userEvent.click(await screen.findByRole('link', { name: 'Operatives' }));
    expect(screen.queryByRole('columnheader', { name: 'Phone' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add operative' })).not.toBeInTheDocument();
  });

  it('only shows a site manager the operatives on their projects', async () => {
    render(<App repository={new MemoryRepository()} initialUser={authenticate('manager', 'demo1234')} />);
    await userEvent.click(await screen.findByRole('link', { name: 'Operatives' }));
    const projectCells = screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[2].textContent);
    expect(projectCells.length).toBeGreaterThan(0);
    expect(projectCells).not.toContain('East Works Depot');
  });
});

describe('operatives', () => {
  it('filters the list as you type', async () => {
    render(<App repository={new MemoryRepository()} initialUser={authenticate('admin', 'demo1234')} />);
    await userEvent.click(await screen.findByRole('link', { name: 'Operatives' }));
    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'Popescu');
    expect(screen.getByText('1 operative')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ioan Popescu' })).toBeInTheDocument();
  });

  it('shows field errors instead of saving an incomplete operative', async () => {
    render(<App repository={new MemoryRepository()} initialUser={authenticate('admin', 'demo1234')} />);
    await userEvent.click(await screen.findByRole('link', { name: 'Operatives' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add operative' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Add operative' }).at(-1)!);
    expect(screen.getByText('Enter a first name.')).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveAttribute('aria-invalid', 'true');
  });
});
