import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

function Button({ children, className = "", ...props }: ButtonProps) {
    return (
        <button
            {...props}
            className={`bg-butter-500 hover:bg-butter-400 cursor-pointer text-white font-bold py-2 px-4 rounded ${className}`}
        >
            {children}
        </button>
    );
}

export default Button;