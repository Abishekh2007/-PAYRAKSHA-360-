import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Button, ButtonLink } from './Button';

describe('Button & ButtonLink', () => {
  it('ButtonLink renders a link with given text and href', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/test-path">Click Me</ButtonLink>
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: 'Click Me' });
    expect(link).toHaveAttribute('href', '/test-path');
  });

  it('ButtonLink has exactly the same className as a Button with the same variant and size', () => {
    const { container: btnContainer } = render(<Button variant="danger" size="lg" fullWidth className="custom-class">Btn</Button>);
    const { container: linkContainer } = render(
      <MemoryRouter>
        <ButtonLink to="/path" variant="danger" size="lg" fullWidth className="custom-class">Link</ButtonLink>
      </MemoryRouter>
    );

    const button = btnContainer.querySelector('button');
    const link = linkContainer.querySelector('a');

    expect(button?.className).toBe(link?.className);
    expect(button?.getAttribute('data-size')).toBe(link?.getAttribute('data-size'));
  });
});
