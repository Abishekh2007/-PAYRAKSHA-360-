import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/** Renders a page or component inside a router (pages use Link / useNavigate). */
export function renderWithRouter(ui: ReactElement, { route = '/' }: { route?: string } = {}): RenderResult {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
