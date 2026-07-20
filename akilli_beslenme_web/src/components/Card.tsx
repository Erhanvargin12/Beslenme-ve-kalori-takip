import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  image?: string;
  imageAlt?: string;
  footer?: React.ReactNode;
  variant?: "elevated" | "outlined" | "filled";
  className?: string;
  id?: string;
}

export default function Card({
  title,
  children,
  image,
  imageAlt,
  footer,
  variant = "elevated",
  className = "",
  id,
}: CardProps) {
  const variants = {
    elevated: `bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-sm`,
    outlined: `bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-sm`,
    filled: `bg-gray-100 dark:bg-gray-800`,
  };

  return (
    <div id={id} className={`rounded-xl overflow-hidden transition-shadow ${variants[variant]} ${className}`}>
      {image && (
        <img src={image} alt={imageAlt || ""} className="w-full h-48 object-cover" />
      )}
      <div className="p-5">
        {title && (
          <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            {title}
          </h3>
        )}
        <div className="text-gray-600 dark:text-gray-400">
          {children}
        </div>
      </div>
      {footer && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
}
