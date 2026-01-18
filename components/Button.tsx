import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "font-sans font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Radius: 10-12px (using rounded-xl for approx 12px)
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-600 text-black-900 rounded-xl shadow-[0_0_10px_rgba(255,159,28,0.2)]",
    secondary: "bg-transparent border border-graphite-600 text-text-primary hover:border-amber-500 hover:text-amber-500 rounded-xl",
    ghost: "text-text-secondary hover:text-amber-500 bg-transparent"
  };

  const sizes = "px-6 py-3 text-sm md:text-base";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </button>
  );
};