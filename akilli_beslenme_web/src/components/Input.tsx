import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  helpText,
  className = "",
  id,
  icon,
  ...props
}: InputProps) {
  const reactId = React.useId();
  const generatedId = id || reactId;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={generatedId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
        <input
          id={generatedId}
          className={`
            w-full px-4 py-2 ${icon ? 'pl-10' : ''} border rounded-lg outline-none transition-colors
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            ${error ? "border-red-500 focus:border-red-500" : "border-gray-300 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"}
            ${props.disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900" : ""}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${generatedId}-error` : helpText ? `${generatedId}-help` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${generatedId}-error`} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={`${id}-help`} className="text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
}
