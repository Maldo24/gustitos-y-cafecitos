## 1. Infraestructura base de frontend (bloqueante para todo lo demás)

- [ ] **Variables de entorno**: mover `API_BASE_URL` (sigue hardcodeado a `http://localhost:3000/api` en `api/client.ts`) a `import.meta.env.VITE_API_URL`, con `.env` / `.env.example`.
- [x] ~~Manejo de token en cada request~~ — `apiClient` ya adjunta `Authorization: Bearer <token>` automáticamente cuando existe.
- [x] ~~Contexto de autenticación (`AuthContext` / store)~~ — implementado en `context/AuthContext.tsx`, expone `user`, `loginContext()`, `logout()`.
- [ ] **Hidratar sesión al recargar contra el backend**: hoy el `AuthContext` lee `user`/`token` de `localStorage` sin validarlos contra `GET /api/auth/me`. Si el token expiró o fue revocado, la app sigue creyendo que hay sesión válida hasta que el backend responda 401 en alguna otra llamada.
- [x] ~~Rutas protegidas~~ — `ProtectedRoute` implementado y aplicado en `/dashboard`. **Pendiente**: aplicarlo también a las futuras rutas de grupo/restaurantes/sesiones (`/grupo/:slug`, etc.), que hoy siguen sin protección.
- [ ] **Manejo global de errores 401**: interceptar respuestas 401 del `apiClient` para forzar `logout()` + redirect automáticamente (útil ahora que no se valida el token al cargar).
- [ ] **Capa de API por recurso**: falta `api/restaurants.ts`, `api/categories.ts`, `api/sessions.ts`. (`api/groups.ts` ya existe, ver sección 3).

## 2. Autenticación (completar flujo existente)

- [ ] Reemplazar el `alert()` post-login por navegación real (ej. a `/dashboard`) usando `useNavigate` — el `AuthContext` y `loginContext()` ya están listos para esto, solo falta el `navigate()` en `Login.tsx`.
- [ ] Manejo de estado de carga (`loading`) en botones de submit de Login/Register para evitar doble envío.
- [ ] Validación de formulario en cliente (email válido, password mínimo, campos requeridos) antes de pegarle al backend.
- [x] ~~Botón de Logout~~ — agregado en `Navbar.tsx`, funcional (limpia contexto + `localStorage` + redirige a `/login`).
- [x] ~~Navbar dinámica~~ — ya distingue logueado/no logueado (muestra botón de logout). **Pendiente**: agregar link visible a `/dashboard` / "Mis Grupos" cuando el usuario está logueado (hoy solo aparece el botón de salir).

## 3. Módulo de Grupos (esqueleto creado, falta conectar de punta a punta)

Endpoints disponibles: crear grupo, obtener por slug, agregar restaurante sugerido, agregar miembro, listar "mis grupos", listar miembros.

- [x] ~~Página "Mis grupos" / Dashboard~~ — existe `pages/Dashboard.tsx` en `/dashboard` con las dos tarjetas ("Crear grupo" y "Unirse con código"), protegida por `ProtectedRoute`.
- [ ] **Conectar `Dashboard.handleCreateGroup` a `createGroup()`** de `api/groups.ts` (hoy solo hace `console.log`, no llega al backend).
- [ ] Tras crear el grupo exitosamente, navegar automáticamente a `/grupo/:slug` con el slug devuelto por el backend.
- [ ] **Validar el código antes de navegar** en `handleJoinGroup`: llamar a `getGroupBySlug()` (ya existe en `api/groups.ts`) para confirmar que el grupo existe y mostrar error si no, en vez de navegar a ciegas.
- [ ] Reemplazar el listado "Mis grupos" (`GET /api/groups/my-groups`) — el Dashboard actual no lista los grupos existentes del usuario, solo ofrece crear/unirse. Falta la sección de grupos ya creados.
- [ ] Página de **detalle de grupo** por slug (`GET /api/groups/:slug`) — sigue siendo el placeholder `<h2>Vista de Grupo (Próximamente)</h2>` en `App.tsx`, sin protección de ruta.
- [ ] Dentro del detalle de grupo: lista de miembros (`GET /api/groups/:groupId/members`).
- [ ] Formulario **"Agregar amigo al grupo"** por username (`POST /api/groups/:groupId/members`).
- [ ] Compartir/copiar el link único del grupo (usa el `slug`) para invitar gente.
- [ ] Estado vacío ("todavía no tienes grupos") + manejo de error/loading en las dos tarjetas del Dashboard (ninguna de las dos muestra spinner ni mensaje de error si el request falla).

## 4. Módulo de Restaurantes (no existe UI, backend completo)

Endpoints disponibles: crear/sugerir restaurante (con detección de duplicados similares), listar por grupo, agregar reseña, votar/quitar voto.

- [ ] Listado de restaurantes sugeridos dentro de la vista de grupo (`GET /api/restaurants/group/:groupId`), idealmente ordenado por votos.
- [ ] Formulario **"Sugerir restaurante"**: nombre, link de Google Maps, categoría (select poblado desde `GET /api/categories`), comentario inicial obligatorio.
- [ ] Manejar la respuesta `WARNING_SIMILAR` del backend: si detecta un restaurante parecido, mostrar un modal de confirmación con la opción de "crear de todas formas" (`forceCreate: true`) en vez de solo tirar error.
- [ ] Botón de **votar / quitar voto** por restaurante, con contador de votos en tiempo real (optimistic UI opcional).
- [ ] Vista de **detalle de restaurante**: reseñas de miembros (`memberReviews`), link a Maps, categoría.
- [ ] Formulario para **agregar reseña** a un restaurante (`POST /api/restaurants/:restaurantId/reviews`).
- [ ] Filtro/orden de restaurantes por categoría y por cantidad de votos.

## 5. Módulo de Categorías

- [ ] Servicio `api/categories.ts` que llame `GET /api/categories` para poblar selects (restaurantes).
- [ ] (Opcional, si hay panel admin) Formulario para crear categoría nueva (`POST /api/categories`).

## 6. Módulo de Sesiones / Dividir cuenta (feature principal, sin ninguna UI)

Este es probablemente el corazón de la app ("cafecitos" → dividir la cuenta) y no tiene absolutamente nada construido en frontend.

- [ ] Página **"Nueva cuenta compartida"**: título, modo de split (`equal` vs `by_consumption`), propina (%), lista dinámica de participantes.
- [ ] Si `splitMode = by_consumption`: UI para que cada participante agregue sus platos consumidos (nombre, precio, cantidad) — probablemente reutilizando datos de `Dish` si se listan platos del restaurante, o input libre.
- [ ] Cálculo/preview del monto final por participante antes de guardar (o confiar en que el backend lo calcula al hacer `POST /api/sessions`).
- [ ] Página de **historial de cuentas de un grupo** (`GET /api/sessions/group/:groupId`).
- [ ] Página de **detalle de una cuenta** (`GET /api/sessions/:sessionId`): desglose por participante, total, propina, estado de pago.
- [ ] Toggle de **"marcar como pagado"** por participante (`PUT /api/sessions/:sessionId/participant/:participantId/pay`).
- [ ] Indicador visual de progreso de pagos (ej. "3 de 5 pagaron").

## 7. Componentes UI reutilizables faltantes

- [ ] `Modal` / `Dialog` genérico (necesario para confirmaciones, "restaurante similar encontrado", crear grupo, etc.)
- [ ] `Card` para restaurantes y grupos en listados.
- [ ] `Select` / `Dropdown` (hoy solo existe `Input` de texto).
- [ ] `Spinner` / estado de carga reutilizable.
- [ ] `Toast` / `Alert` para reemplazar los `alert()` nativos usados en Login/Register.
- [ ] `Badge` para votos / estado de pago.
- [ ] Página **404** real con estilo (hoy es un `<h2>` plano) y layout consistente con el resto del sitio.
- [ ] Componente de **error boundary** o manejo consistente de errores de red en toda la app.

## 8. Calidad general / pulido

- [ ] Responsive real en las páginas nuevas (Login/Register/Home ya usan Tailwind con `md:` breakpoints; replicar el patrón).
- [ ] Accesibilidad: labels asociados correctamente a inputs (revisar `Input.tsx`, usa `label` visual pero sin `htmlFor`/`id`).
- [ ] Loading skeletons o spinners en listados (grupos, restaurantes, sesiones) mientras cargan datos async.
- [ ] Manejo de estados vacíos en todos los listados (sin grupos, sin restaurantes, sin cuentas aún).
- [ ] Tipado: completar `types/index.ts` con `Session`, `ISessionParticipant`, `Dish`, ya que hoy solo cubre `User`, `Category`, `Restaurant`, `Group`.
- [ ] Revisar el bug de tipeo `firtsSurname` en `types/index.ts` (debería ser `firstSurname`, como en el resto del código).
- [ ] Tests básicos (unitarios/E2E) — el repo no muestra ninguna suite de tests para el frontend todavía.

---

## Sugerencia de orden de implementación (actualizada)

1. ~~Infraestructura base (sección 1)~~ → ya avanzada; solo falta env vars, hidratación de sesión contra `/auth/me` e interceptor 401.
2. **Cerrar los cabos sueltos de grupos (sección 3)**: conectar `Dashboard` a `api/groups.ts` de verdad (crear + validar código) y construir la vista de detalle de grupo. Es lo más cercano a terminar y desbloquea todo lo demás.
3. Restaurantes (sección 4) — depende de que exista la vista de detalle de grupo.
4. Sesiones/dividir cuenta (sección 6) — la feature más grande y todavía sin ningún avance.
5. Componentes UI + pulido general (secciones 7 y 8) en paralelo conforme se van necesitando.