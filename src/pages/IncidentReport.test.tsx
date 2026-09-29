import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithRouter } from '../test/utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncidentReport from './IncidentReport';
import { useDemoStore, flagshipReport } from '../store/demoStore';

describe('IncidentReport', () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it('renders report and can export', async () => {
    const user = userEvent.setup();
    const createObjUrl = vi.fn().mockReturnValue('blob:test');
    URL.createObjectURL = createObjUrl;
    URL.revokeObjectURL = vi.fn();
    
    renderWithRouter(<IncidentReport />);
    
    expect(screen.getByText('DEMO REPORT — NOT AN OFFICIAL CYBERCRIME REPORT')).toBeInTheDocument();
    
    const flag = flagshipReport();
    expect(screen.getByText(`ID: ${flag.id}`)).toBeInTheDocument();
    
    const exportBtn = screen.getByRole('button', { name: /EXPORT DEMO REPORT/i });
    await user.click(exportBtn);
    
    expect(createObjUrl).toHaveBeenCalled();
  });
});
