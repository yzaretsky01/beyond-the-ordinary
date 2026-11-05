import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useProgress } from '../../app/state/progressStore';
import QcRoom from './QcRoom';

beforeEach(() => useProgress.setState({ discoveries: {}, challenges: {} }));

function renderRoom() {
  render(
    <MemoryRouter>
      <QcRoom />
    </MemoryRouter>,
  );
}

async function toExperiment() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Make a prediction' }));
  await user.click(screen.getByRole('radio', { name: /always 0/i }));
  await user.click(screen.getByRole('button', { name: /lock in my prediction/i }));
  return user;
}

describe('Quantum computing room', () => {
  it('locking the prediction loads H·H; measuring always gives 0', async () => {
    renderRoom();
    const user = await toExperiment();
    expect(screen.getByRole('button', { name: /qubit 0, step 1: h/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Measure 100 times' }));
    expect(screen.getByTestId('shots')).toHaveTextContent('100');
    expect(screen.getByTestId('last')).toHaveTextContent('|0⟩');
  });

  it('tap a gate then a slot places it; tapping again removes it; the amplitudes respond', async () => {
    renderRoom();
    const user = await toExperiment();
    await user.click(screen.getByRole('button', { name: 'Clear circuit' }));
    await user.click(screen.getByRole('button', { name: 'X' }));
    await user.click(screen.getByRole('button', { name: /qubit 0, step 1: empty/i }));
    expect(screen.getByRole('img', { name: /\|1⟩: probability 100 percent/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /qubit 0, step 1: x/i }));
    expect(screen.getByRole('img', { name: /\|0⟩: probability 100 percent/ })).toBeInTheDocument();
  });

  it('qubit count, view scrubber and presets change the simulation', async () => {
    renderRoom();
    const user = await toExperiment();
    await user.click(screen.getByRole('radio', { name: '3' }));
    expect(screen.getAllByRole('img', { name: /probability/ })).toHaveLength(8);
    await user.click(screen.getByRole('button', { name: 'Bell pair' }));
    expect(screen.getAllByRole('img', { name: /probability 50 percent/ })).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Show the state after step'), { target: { value: '0' } });
    expect(screen.getByRole('img', { name: /\|00⟩: probability 100 percent/ })).toBeInTheDocument();
  });

  it('a challenge completes when the state is reached', async () => {
    renderRoom();
    const user = await toExperiment();
    await user.click(screen.getByRole('button', { name: 'Bell pair' }));
    expect(screen.getByText(/make the pair state/i).closest('li')).toHaveAttribute('data-done', 'true');
  });
});
