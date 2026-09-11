import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white p-4 rounded-xl shadow-md border border-butter-200 ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;