# gustitos-y-cafecitos
proyecto que busca organizar restaurantes y cafecitos en grupos para poder salir y tener opciones
# 1. ¿Cómo funciona la arquitectura?
Tienen un proyecto principal (la raíz) y subproyectos (apps/web, apps/api).
Gracias a pnpm, todos los paquetes pesados de node_modules se instalan una sola vez de forma global en tu disco duro. En las carpetas de tus proyectos, pnpm solo crea un "enlace directo" (symlink). Esto hace que el proyecto sea ultra rápido de instalar, ocupe 5 veces menos espacio que usando npm, y permita compartir código fácilmente.

# 2. Regla de Oro: NUNCA USAR npm install
Si un desarrollador usa npm install, romperá los enlaces simbólicos y creará dependencias duplicadas. Toda instalación o comando se ejecuta utilizando pnpm.

# 3. ¿Cómo instalar paquetes? (2 Métodos)
Método A: El Método Ninja (Desde la Raíz - Recomendado)
No necesitas navegar entre carpetas. Si estás parado en la raíz, puedes decirle a pnpm exactamente a dónde enviar el paquete usando el flag --filter (que apunta al nombre de la carpeta).

# Instalar algo en el frontend:
pnpm --filter web add axios

# Instalar algo en el backend:
pnpm --filter api add bcrypt

# Instalar dependencias de desarrollo (como tipados o plugins):
pnpm --filter web add -D @types/react


# Método B: El Método Clásico (Navegando)
Si vas a trabajar un buen rato en una sola área, puedes entrar a la carpeta y ejecutar pnpm add normalmente. Pnpm sabrá qué hacer.

cd apps/api
pnpm add jsonwebtoken
cd ../..

# 4. ¿Cómo arrancar el proyecto para programar?
Te paras en la raíz y ejecutas un único comando. Esto levantará tanto Vite (para la web) como Node (para la API) al mismo tiempo, dándote URLs locales (localhost) y URLs de red (192.168.x.x) para probar desde el teléfono móvil conectado al mismo WiFi.

pnpm dev