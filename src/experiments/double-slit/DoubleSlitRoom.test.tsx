import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgress } from '../../app/state/progressStore';
import DoubleSlitRoom from './DoubleSlitRoom';
import { DoubleSlitSimulation } from './simulation';

// jsdom has no canvas or ResizeObserver; the room must still work (the stage simply doesn't paint).
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});

beforeEach(() => {
  useProgress.setState({ discoveries: {}, challenges: {} });
});

function renderRoom() {
  const setParams = vi.spyOn(DoubleSlitSimulation.prototype, 'setParams');
  render(
    <MemoryRouter>
      <DoubleSlitRoom />
    </MemoryRouter>,
  );
  return { setParams };
}

async function toExperiment() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /make a prediction/i }));
  await user.click(screen.getByRole('radio', { name: /two bright bands/i }));
  await user.click(screen.getByRole('button', { name: /lock in my prediction/i }));
  return user;
}

describe('Double-slit room', () => {
  it('opens on the Wonder step with the question', () => {
    renderRoom();
    expect(
      screen.getByRole('heading', { name: /can one photon go through two slits at once/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wonder' })).toHaveAttribute('aria-current', 'step');
  });

  it('cannot fire before predicting; locking a prediction opens the experiment', async () => {
    renderRoom();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Experiment' }));
    expect(screen.getByRole('button', { name: 'Fire one photon' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /fire continuously/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Wonder' }));
    await toExperiment();
    expect(screen.getByRole('button', { name: 'Experiment' })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'Fire one photon' })).toBeEnabled();
  });

  it('every control reaches the simulation', async () => {
    const { setParams } = renderRoom();
    const user = await toExperiment();
    setParams.mockClear();
    fireEvent.change(screen.getByLabelText('Wavelength'), { target: { value: '650' } });
    expect(setParams).toHaveBeenLastCalledWith({ wavelengthNm: 650 });
    fireEvent.change(screen.getByLabelText('Slit separation'), { target: { value: '0.3' } });
    expect(setParams).toHaveBeenLastCalledWith({ separationMm: 0.3 });
    fireEvent.change(screen.getByLabelText('Slit width'), { target: { value: '0.05' } });
    expect(setParams).toHaveBeenLastCalledWith({ slitWidthMm: 0.05 });
    fireEvent.change(screen.getByLabelText('Screen distance'), { target: { value: '2' } });
    expect(setParams).toHaveBeenLastCalledWith({ screenDistanceM: 2 });
    await user.click(screen.getByRole('radio', { name: 'Top only' }));
    expect(setParams).toHaveBeenLastCalledWith({ openSlits: 'upper' });
    await user.click(screen.getByRole('switch', { name: /which-slit detector/i }));
    expect(setParams).toHaveBeenLastCalledWith({ detector: true });
    // the panel reflects the new state of the simulation
    expect(screen.getByLabelText('Wavelength')).toHaveValue('650');
    expect(screen.getByRole('switch', { name: /which-slit detector/i })).toBeChecked();
  });

  it('firing lands photons and reset restores defaults', async () => {
    renderRoom();
    const user = await toExperiment();
    await user.click(screen.getByRole('button', { name: 'Fire one photon' }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(Number(screen.getByTestId('arrivals').textContent)).toBe(1);
    fireEvent.change(screen.getByLabelText('Wavelength'), { target: { value: '450' } });
    await user.click(screen.getByRole('button', { name: /reset everything/i }));
    expect(screen.getByLabelText('Wavelength')).toHaveValue('532');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(screen.getByTestId('arrivals').textContent).toBe('0');
  });

  it('tooltips open on click and close with Escape', async () => {
    renderRoom();
    const user = await toExperiment();
    const tip = screen.getByRole('button', { name: 'About Wavelength' });
    await user.click(tip);
    expect(screen.getByRole('note')).toHaveTextContent(/colour of the light/i);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('knowledge check gives feedback and can show the answer on the stage', async () => {
    const { setParams } = renderRoom();
    const user = await toExperiment();
    await user.click(screen.getByRole('button', { name: 'Explain' }));
    await user.click(screen.getByRole('radio', { name: /one broad glow/i }));
    await user.click(screen.getAllByRole('button', { name: /check my answer/i })[0]);
    expect(screen.getByText(/right\. with only one path/i)).toBeInTheDocument();
    setParams.mockClear();
    await user.click(screen.getByRole('button', { name: /close the top slit and watch/i }));
    expect(setParams).toHaveBeenCalledWith(expect.objectContaining({ openSlits: 'lower' }));
  });
});
