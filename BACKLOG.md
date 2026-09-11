## 1. Infraestructura base de frontend (bloqueante para todo lo demás)

- [x] **Variables de entorno**: mover `API_BASE_URL` a `import.meta.env.VITE_API_URL`, con `.env` / `.env.example`.
- [x] ~~Manejo de token en cada request~~ — `apiClient` ya adjunta `Authorization: Bearer <token>` automáticamente cuando existe.
- [x] ~~Contexto de autenticación (`AuthContext` / store)~~ — implementado en `context/AuthContext.tsx`, expone `user`, `loginContext()`, `logout()`.
- [x] **Hidratar sesión al recargar contra el backend** — `AuthContext` llama `GET /api/auth/me` al montar con `isLoading`, `ProtectedRoute` espera la carga.
- [x] ~~Rutas protegidas~~ — aplicado en `/dashboard` y `/grupo/:slug`.
- [x] **Manejo global de errores 401** — interceptor en `apiClient` que fuerza `logout()` + redirect a `/login`.
- [x] **Capa de API por recurso** — creados `api/restaurants.ts`, `api/categories.ts`, `api/sessions.ts`.

## 2. Autenticación (completar flujo existente)

- [x] Reemplazar el `alert()` post-login por navegación real (ej. a `/dashboard`) usando `useNavigate`.
- [x] Manejo de estado de carga (`loading`) en botones de submit de Login/Register para evitar doble envío.
- [x] Validación de formulario en cliente (email válido, password mínimo, campos requeridos) antes de pegarle al backend.
- [x] ~~Botón de Logout~~ — agregado en `Navbar.tsx`, funcional.
- [x] ~~Navbar dinámica~~ — ya distingue logueado/no logueado (muestra link "Mis Grupos" + botón de logout).

## 3. Módulo de Grupos (esqueleto creado, falta conectar de punta a punta)

Endpoints disponibles: crear grupo, obtener por slug, agregar restaurante sugerido, agregar miembro, listar "mis grupos", listar miembros.

- [x] ~~Página "Mis grupos" / Dashboard~~ — existe `pages/Dashboard.tsx` en `/dashboard`, protegida por `ProtectedRoute`.
- [x] **Conectar `Dashboard.handleCreateGroup` a `createGroup()`** de `api/groups.ts`.
- [x] Tras crear el grupo exitosamente, navegar automáticamente a `/grupo/:slug` con el slug devuelto por el backend.
- [x] **Validar el código antes de navegar** en `handleJoinGroup`: llamar a `getGroupBySlug()` y mostrar error si no existe.
- [x] Reemplazar el listado "Mis grupos" (`GET /api/groups/my-groups`) — el Dashboard lista los grupos del usuario.
- [x] Página de **detalle de grupo** por slug (`GET /api/groups/:slug`) — `pages/GroupDetail.tsx`, con protección de ruta.
- [x] Dentro del detalle de grupo: lista de miembros (`GET /api/groups/:groupId/members`).
- [x] Formulario **"Agregar amigo al grupo"** por username (`POST /api/groups/:groupId/members`).
- [x] Compartir/copiar el link único del grupo (usa el `slug`) para invitar gente.
- [x] Estado vacío ("todavía no tienes grupos") + manejo de error/loading en las dos tarjetas del Dashboard.

**Nota**: el backend `GET /api/groups/my-groups` tenía un bug (ruta capturada por `/:slug` y sin middleware de token). Arreglado en `groupRoutes.ts` — **pendiente de redeploy a Render**.

## 4. Módulo de Restaurantes (UI implementada en la vista de grupo)

Endpoints disponibles: crear/sugerir restaurante (con detección de duplicados similares), listar por grupo, agregar reseña, votar/quitar voto.

- [x] Listado de restaurantes sugeridos dentro de la vista de grupo (`GET /api/restaurants/group/:groupId`), ordenado por votos (el backend ya ordena por `votesCount`).
- [x] Formulario **"Sugerir restaurante"**: nombre, link de Google Maps, categoría (select poblado desde `GET /api/categories`), comentario inicial obligatorio.
- [x] Manejar la respuesta `WARNING_SIMILAR` del backend: modal de confirmación con la opción de "crear de todas formas" (`forceCreate: true`).
- [x] Botón de **votar / quitar voto** por restaurante, con contador de votos en tiempo real (recarga el listado tras votar).
- [ ] Vista de **detalle de restaurante** (página propia): reseñas de miembros, link a Maps, categoría — actualmente las reseñas/links se muestran inline en la tarjeta del listado.
- [x] Formulario para **agregar reseña** a un restaurante (`POST /api/restaurants/:restaurantId/reviews`) — inline en cada tarjeta.
- [x] Filtro de restaurantes por categoría (el backend ya ordena por votos).

**Nota**: el frontend detecta si el usuario ya votó comparando `user.id` con el array `votes` del restaurante. El backend `authController.login` ahora devuelve `id` en el usuario — **requiere redeploy a Render**.

## 5. Módulo de Categorías

- [x] Servicio `api/categories.ts` que llame `GET /api/categories` y `POST /api/categories` para poblar selects (restaurantes).
- [ ] (Opcional, si hay panel admin) Formulario para crear categoría nueva (`POST /api/categories`).

## 6. Módulo de Sesiones / Dividir cuenta (UI implementada)

- [x] Página **"Nueva cuenta compartida"** (`/grupo/:slug/nueva-cuenta`): título, modo de split (`equal` vs `by_consumption`), propina (%), lista dinámica de participantes (`pages/CreateSession.tsx`).
- [x] Si `splitMode = by_consumption`: UI para que cada participante agregue sus platos consumidos (nombre, precio, cantidad).
- [x] Cálculo/preview del monto final por participante antes de guardar (replica la lógica del backend).
- [x] Página de **historial de cuentas de un grupo** (`GET /api/sessions/group/:groupId`) — integrado en `GroupDetail.tsx` con botón "+ Nueva cuenta".
- [x] Página de **detalle de una cuenta** (`/cuenta/:sessionId` en `pages/SessionDetail.tsx`): desglose por participante, total, propina, estado de pago.
- [x] Toggle de **"marcar como pagado"** por participante (`PUT /api/sessions/:sessionId/participant/:participantId/pay`).
- [x] Indicador visual de progreso de pagos (ej. "3 de 5 pagaron" + barra de progreso).

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
- [x] Tipado: completar `types/index.ts` con `Session`, `SessionParticipant`, `ItemConsumed` (falta `Dish`).
- [ ] Revisar el bug de tipeo `firtsSurname` en `types/index.ts` (debería ser `firstSurname`, como en el resto del código).
- [ ] Tests básicos (unitarios/E2E) — el repo no muestra ninguna suite de tests para el frontend todavía.

---

## Sugerencia de orden de implementación (actualizada)

1. ~~Infraestructura base (sección 1)~~ ✅ completada.
2. ~~Cerrar los cabos sueltos de grupos (sección 3)~~ ✅ completado (backend `my-groups` pendiente de redeploy).
3. ~~Restaurantes (sección 4)~~ ✅ UI completa en la vista de grupo (backend login `id` pendiente de redeploy).
4. ~~Sesiones/dividir cuenta (sección 6)~~ ✅ UI completa (`CreateSession`, `SessionDetail`, historial en grupo).
5. Componentes UI + pulido general (secciones 7 y 8) — **siguiente**.