import React from 'react';

export interface SkipToContentProps {
  targetId?: string;
  children?: React.ReactNode;
  className?: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({
  targetId = 'main-content',
  children = 'Skip to main content',
  className = '',
}) => {
  return (
    <a
      href={`#${targetId}`}
      className={`
        sr-only
        focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2 focus:rounded-lg
        focus:bg-accent focus:text-white
        focus:font-medium focus:text-sm
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        focus:shadow-lg
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </a>
  );
};
