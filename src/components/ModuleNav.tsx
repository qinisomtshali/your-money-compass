import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ModuleNavItem {
  to: string;
  label: string;
}

export const ModuleNav = ({ items }: { items: ModuleNavItem[] }) => (
  <div className="flex gap-1 mb-6">
    {items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end
        className={({ isActive }) =>
          cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )
        }
      >
        {item.label}
      </NavLink>
    ))}
  </div>
);
