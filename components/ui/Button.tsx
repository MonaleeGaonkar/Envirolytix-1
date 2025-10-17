import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyle = `
    inline-flex items-center justify-center 
    font-semibold
    rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none 
    focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary
    dark:focus-visible:ring-offset-background-dark
    disabled:opacity-60 disabled:cursor-not-allowed
  `;

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: 'bg-gradient-primary text-white shadow-md hover:shadow-lg hover:brightness-110 active:brightness-100 disabled:shadow-none',
    secondary: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 disabled:shadow-none',
    ghost: 'bg-transparent shadow-none hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300',
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;