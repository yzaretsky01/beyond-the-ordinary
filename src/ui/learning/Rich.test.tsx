import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Rich, plain, termKeys } from './Rich';

describe('Rich text', () => {
  it('turns {{key}} and {{key|words}} into glossary buttons', async () => {
    render(
      <p>
        <Rich text="A {{photon}} meets two {{slit|slits}}." />
      </p>,
    );
    expect(screen.getByRole('button', { name: 'photon' })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'slits' }));
    expect(screen.getByRole('note')).toHaveTextContent(/Slit\. A narrow opening/);
  });

  it('leaves unknown keys as plain words rather than breaking', () => {
    render(
      <p>
        <Rich text="A {{nonsense|mystery}} word." />
      </p>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('A mystery word.', { exact: false })).toBeInTheDocument();
  });

  it('plain() and termKeys() read the markup', () => {
    expect(plain('Two {{slit|slits}} and a {{photon}}.')).toBe('Two slits and a photon.');
    expect(termKeys('{{phase}} and {{probability|odds}}')).toEqual(['phase', 'probability']);
  });
});
