import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: 'green' | 'red' | 'butter' | 'gray';
}

const colors = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  butter: 'bg-butter-100 text-butter-700',
  gray: 'bg-gray-100 text-gray-600',
};

function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${colors[color]}`}>
      {children}
    </span>
  );
}

export default Badge;