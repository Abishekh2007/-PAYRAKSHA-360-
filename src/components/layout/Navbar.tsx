// STUB: replaced by the layout task. Primary links come from ROUTES (group 'primary'), "More" from group 'more'.
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes';

export function Navbar() {
  return (
    <nav aria-label="Main">
      {ROUTES.filter((r) => r.group === 'primary').map((r) => (
        <NavLink key={r.path} to={r.path}>{r.label}</NavLink>
      ))}
    </nav>
  );
}
