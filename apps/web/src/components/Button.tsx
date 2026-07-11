function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="bg-butter-500 hover:bg-butter-400 cursor-pointer text-white font-bold py-2 px-4 rounded"
        >
            {children}
        </button>
    );
}

export default Button;