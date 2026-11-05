import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgress } from '../../app/state/progressStore';
import EntanglementRoom from './EntanglementRoom';
import { EntanglementSimulation } from './simulation';

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});
beforeEach(() => useProgress.setState({ discoveries: {}, challenges: {} }));

function renderRoom() {
  const setParams = vi.spyOn(EntanglementSimulation.prototype, 'setParams');
  render(
    <MemoryRouter>
      <EntanglementRoom />
    </MemoryRouter>,
  );
  return { setParams };
}

async function toExperiment() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Make a prediction' }));
  await user.click(screen.getByRole('button', { name: /lock in my prediction/i }));
  return user;
}

describe('Entanglement room', () => {
  it('starts at Wonder; locking a prediction sets up the 30° experiment', async () => {
    renderRoom();
    expect(screen.getByRole('heading', { name: /share one story/i })).toBeInTheDocument();
    await toExperiment();
    expect(screen.getByLabelText('Bob’s polariser')).toHaveValue('30');
  });

  it('every control reaches the simulation', async () => {
    const { setParams } = renderRoom();
    const user = await toExperiment();
    setParams.mockClear();
    fireEvent.change(screen.getByLabelText('Alice’s polariser'), { target: { value: '10' } });
    expect(setParams).toHaveBeenLastCalledWith({ aDeg: 10 });
    fireEvent.change(screen.getByLabelText('Bob’s polariser'), { target: { value: '55' } });
    expect(setParams).toHaveBeenLastCalledWith({ bDeg: 55 });
    await user.click(screen.getByRole('radio', { name: 'Hidden instructions' }));
    expect(setParams).toHaveBeenLastCalledWith({ source: 'hidden' });
    await user.click(screen.getByRole('radio', { name: 'Bell test' }));
    expect(setParams).toHaveBeenLastCalledWith({ mode: 'bell' });
    expect(screen.getByText('Bell score S')).toBeInTheDocument();
  });

  it('firing counts pairs; reset clears', async () => {
    renderRoom();
    const user = await toExperiment();
    await user.click(screen.getByRole('button', { name: 'Fire one pair' }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(screen.getByTestId('pairs').textContent).toBe('1');
    await user.click(screen.getByRole('button', { name: /reset everything/i }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(screen.getByTestId('pairs').textContent).toBe('0');
  });

  it('knowledge check gives feedback and demonstrates', async () => {
    const { setParams } = renderRoom();
    const user = await toExperiment();
    await user.click(screen.getByRole('button', { name: 'Explain' }));
    await user.click(screen.getByRole('radio', { name: /stay 50\/50/i }));
    await user.click(screen.getAllByRole('button', { name: /check my answer/i })[0]);
    expect(screen.getByText(/right\. alice alone/i)).toBeInTheDocument();
    setParams.mockClear();
    await user.click(screen.getByRole('button', { name: /turn bob’s dial and watch/i }));
    expect(setParams).toHaveBeenCalledWith(expect.objectContaining({ bDeg: 60 }));
  });
});
