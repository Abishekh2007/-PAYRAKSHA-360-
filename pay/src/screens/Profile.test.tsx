import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import Profile from './Profile';
import { usePayStore } from '../store/payStore';
import type { PayRecord } from '../store/payStore';

describe('Profile Screen', () => {
  beforeEach(() => {
    usePayStore.setState({
      deviceName: 'Old Phone',
      draft: null,
      records: [{ id: '1' } as PayRecord],
      link: { online: false, lastSeen: null, target: null },
    });
  });

  const renderScreen = () =>
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

  it('updates device name', async () => {
    renderScreen();
    const user = userEvent.setup();

    const input = screen.getByLabelText('Device name');
    expect(input).toHaveValue('Old Phone');

    await user.clear(input);
    await user.type(input, 'New Phone  '); // Will be trimmed by setDeviceName if implementation trims it. Wait, the component passes input value directly to setDeviceName, then the store setter handles trimming (we see store code trims).

    await user.click(screen.getByText('Save'));

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(usePayStore.getState().deviceName).toBe('New Phone');
  });

  it('resets demo data', async () => {
    renderScreen();
    const user = userEvent.setup();

    expect(usePayStore.getState().records).toHaveLength(1);

    await user.click(screen.getByText('Reset demo data'));
    await user.click(screen.getByText('Clear'));

    expect(usePayStore.getState().records).toHaveLength(0);
  });
});
