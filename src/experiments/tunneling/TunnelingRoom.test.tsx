import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgress } from '../../app/state/progressStore';
import { TunnelingSimulation } from './simulation';
import TunnelingRoom from './TunnelingRoom';

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
  const setParams = vi.spyOn(TunnelingSimulation.prototype, 'setParams');
  const launch = vi.spyOn(TunnelingSimulation.prototype, 'launch');
  render(
    <MemoryRouter>
      <TunnelingRoom />
    </MemoryRouter>,
  );
  return { setParams, launch };
}

async function toExperiment() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Make a prediction' }));
  await user.click(screen.getByRole('button', { name: /lock in my prediction/i }));
  return user;
}

describe('Tunneling room', () => {
  it('launch is blocked until a prediction is locked', async () => {
    renderRoom();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Experiment' }));
    expect(screen.getByRole('button', { name: 'Launch electron' })).toBeDisabled();
  });

  it('every control reaches the simulation; launch starts a run', async () => {
    const { setParams, launch } = renderRoom();
    const user = await toExperiment();
    setParams.mockClear();
    fireEvent.change(screen.getByLabelText('Electron energy'), { target: { value: '6' } });
    expect(setParams).toHaveBeenLastCalledWith({ energyEv: 6 });
    fireEvent.change(screen.getByLabelText('Wall height'), { target: { value: '9' } });
    expect(setParams).toHaveBeenLastCalledWith({ barrierEv: 9 });
    fireEvent.change(screen.getByLabelText('Wall thickness'), { target: { value: '0.3' } });
    expect(setParams).toHaveBeenLastCalledWith({ widthNm: 0.3 });
    fireEvent.change(screen.getByLabelText('Wave packet width'), { target: { value: '1' } });
    expect(setParams).toHaveBeenLastCalledWith({ packetNm: 1 });
    await user.click(screen.getByRole('button', { name: 'Launch electron' }));
    expect(launch).toHaveBeenCalled();
  });

  it('knowledge check feedback and demonstration', async () => {
    const { setParams } = renderRoom();
    const user = await toExperiment();
    await user.click(screen.getByRole('button', { name: 'Explain' }));
    await user.click(screen.getByRole('radio', { name: /yes, some/i }));
    await user.click(screen.getAllByRole('button', { name: /check my answer/i })[1]);
    expect(screen.getByText(/right\. a sudden change/i)).toBeInTheDocument();
    setParams.mockClear();
    await user.click(screen.getByRole('button', { name: /raise the energy above the wall/i }));
    expect(setParams).toHaveBeenCalledWith(expect.objectContaining({ energyEv: 9 }));
  });
});
