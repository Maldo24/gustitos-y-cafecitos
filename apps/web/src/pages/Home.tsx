import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

function Home() {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-butter-100 font-sans w-full">
            <div className="w-full md:w-1/2 h-64 md:h-screen">
                <img 
                    src="https://i.pinimg.com/1200x/e9/5a/08/e95a08ea67e4ca64ea4f205e1ef8d595.jpg" 
                    alt="Imagen de café" 
                    className="w-full h-full object-cover shadow-md" 
                />
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-4xl font-bold mb-10">
                    Recuerda tus <br/>restaurantes favoritos
                </h1>
                
                <div className="flex flex-col w-full max-w-xs gap-4">
                    <Button onClick={() => navigate('/register')}>
                        Registrarse
                    </Button>
                    <Button onClick={() => navigate('/login')}>
                        Iniciar Sesión
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Home;