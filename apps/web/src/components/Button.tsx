import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'light' | 'danger';
}

function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
    const variants = {
        primary: "bg-butter-500 hover:bg-butter-400 text-white",
        light: "bg-butter-100 hover:bg-butter-200 text-butter-500",
        danger: "bg-red-500 hover:bg-red-400 text-white",
    };

    return (
        <button
            {...props}
            className={`${variants[variant]} cursor-pointer font-bold py-2 px-4 rounded transition-colors ${className}`}
        >
            {children}
        </button>
    );
}

export default Button;