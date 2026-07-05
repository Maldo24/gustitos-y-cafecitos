# gustitos-y-cafecitos

Proyecto para organizar restaurantes y cafecitos en grupos, con frontend React/Vite y backend Express/MongoDB.

## 1. Arquitectura
- Raíz del monorepo: contiene scripts comunes y `pnpm-workspace.yaml`.
- `apps/web`: aplicación frontend con React 19, Vite y TypeScript.
- `apps/api`: API backend con Express 5, Mongoose, CORS y dotenv.

## 2. Paquetes y package manager
- Usa `pnpm` en todo momento.
- El proyecto está configurado para `pnpm` v11.1.3 en el `package.json` raíz.
- No usar `npm install`, porque rompe los enlaces simbólicos del monorepo.

## 3. Instalación
Desde la raíz del proyecto:

pnpm install

## 4. Comandos principales
### Levantar todo en development
Desde la raíz:

pnpm dev

Esto ejecuta en paralelo:
- `apps/web`: `pnpm --filter web dev`
- `apps/api`: `pnpm --filter api dev`

### Levantar solo el frontend

pnpm --filter web dev

### Levantar solo el backend

pnpm --filter api dev

### Build de la web

pnpm --filter web build

### Lint del frontend

pnpm --filter web lint

## 5. Estructura de carpetas importantes
- `apps/web/src`: código React del frontend.
- `apps/web/public`: activos públicos del frontend.
- `apps/api/src`: código del backend y modelos de datos.
- `apps/api/src/models`: esquemas de Mongoose y modelos de la API.

## 6. Detalles de la API
- El backend usa `tsx watch src/index.ts` para ejecutar cambios en caliente.
- Usa `express`, `mongoose`, `cors` y `dotenv`.
- El backend se ejecuta desde `apps/api/src/index.ts`.

## 7. Detalles del frontend
- Frontend con React 19 y Vite.
- Build de producción con `tsc -b && vite build`.
- ESLint configurado en `apps/web/eslint.config.js`.

## 8. Cómo agregar dependencias
### Desde la raíz con filtro (recomendado)

pnpm --filter web add <paquete>
pnpm --filter api add <paquete>

### Si trabajas en una sola app

cd apps/api
pnpm add <paquete>

cd apps/web
pnpm add <paquete>

## 9. Nota final
Cualquier cambio en la configuración del monorepo debe hacerse desde la raíz para mantener los enlaces de `pnpm` consistentes.

> Si necesitás que actualice el README con más detalles del dominio, las rutas disponibles o el uso de las APIs, avisame.