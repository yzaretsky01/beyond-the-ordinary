import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgress } from '../../app/state/progressStore';
import { SuperpositionSimulation } from './simulation';
import SuperpositionRoom from './SuperpositionRoom';

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
  const setParams = vi.spyOn(SuperpositionSimulation.prototype, 'setParams');
  render(
    <MemoryRouter>
      <SuperpositionRoom />
    </MemoryRouter>,
  );
  return { setParams };
}

async function toExperiment() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Make a prediction' }));
  fireEvent.change(screen.getByLabelText('Photons reaching D1'), { target: { value: '50' } });
  await user.click(screen.getByRole('button', { name: /lock in my prediction/i }));
  return user;
}

describe('Superposition room', () => {
  it('opens on Wonder and blocks firing until a prediction is locked', async () => {
    renderRoom();
    expect(screen.getByRole('heading', { name: /travel two paths and meet itself/i })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Experiment' }));
    expect(screen.getByRole('button', { name: 'Fire one photon' })).toBeDisabled();
  });

  it('every control reaches the simulation', async () => {
    const { setParams } = renderRoom();
    const user = await toExperiment();
    setParams.mockClear();
    fireEvent.change(screen.getByLabelText('First splitter'), { target: { value: '60' } });
    expect(setParams).toHaveBeenLastCalledWith({ thetaDeg: 60 });
    fireEvent.change(screen.getByLabelText('Phase shift φ'), { target: { value: '180' } });
    expect(setParams).toHaveBeenLastCalledWith({ phiDeg: 180 });
    await user.click(screen.getByRole('switch', { name: /second splitter in place/i }));
    expect(setParams).toHaveBeenLastCalledWith({ secondSplitter: false });
  });

  it('firing updates the detector counts; reset clears them', async () => {
    renderRoom();
    const user = await toExperiment();
    await user.click(screen.getByRole('button', { name: 'Fire one photon' }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(screen.getByTestId('d1').textContent).toBe('1'); // defaults: every photon to D1
    await user.click(screen.getByRole('button', { name: /reset everything/i }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(screen.getByTestId('d1').textContent).toBe('0');
  });

  it('knowledge check answers and demonstrates on the stage', async () => {
    const { setParams } = renderRoom();
    const user = await toExperiment();
    await user.click(screen.getByRole('button', { name: 'Explain' }));
    await user.click(screen.getByRole('radio', { name: /all to d2/i }));
    await user.click(screen.getAllByRole('button', { name: /check my answer/i })[1]);
    expect(screen.getByText(/right\. half a wave/i)).toBeInTheDocument();
    setParams.mockClear();
    await user.click(screen.getByRole('button', { name: /set the phase to 180/i }));
    expect(setParams).toHaveBeenCalledWith(expect.objectContaining({ phiDeg: 180 }));
  });
});
