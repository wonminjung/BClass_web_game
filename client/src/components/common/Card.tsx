import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const Card = React.memo(function Card({
  children,
  className = '',
  onClick,
  hover = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`panel ${hover ? 'hover:border-dungeon-accent/60 hover:shadow-lg hover:shadow-dungeon-accent/10 cursor-pointer transition-all duration-200' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
});

export default Card;
