# PionerosHex · Frontend

Cliente web del juego multijugador PionerosHex: Next.js 16 (App Router), React 19, TypeScript 6,
Tailwind 4, Vitest 5 + Testing Library, pnpm 11, Node 24. El servidor está en el repo hermano
`pioneroshex-backend`: es la única fuente de verdad del juego.

## Comandos

`pnpm dev` (puerto 3000; el backend debe estar en el 3001) · `build` · `start` · `lint` ·
`format:check` · `typecheck` · `test` · `test:cov`.

Antes de dar algo por terminado: `lint`, `typecheck`, `test:cov` y `build`.

## Flujo de ramas y commits

- Solo `main` y `develop`. **Se trabaja en `develop`.** `main` recibe cambios solo por PR
  `develop` → `main`, fusionado con **merge commit** (nunca squash ni rebase).
- No hay ramas de feature ni protección de ramas (plan gratuito, repo privado).
- Commits: `tipo: descripción`. Tipos: `feat, fix, refactor, docs, test, chore, perf, ci`.
  Descripción en español, encabezado de máximo 100 caracteres.
- Husky corre lint-staged (pre-commit), commitlint (commit-msg) y typecheck + test (pre-push).
  Nunca usar `--no-verify`.

## Arquitectura

```
src/app/         rutas de Next (App Router)
src/config/      env.ts: variables públicas validadas con Zod
src/lib/         lógica pura y cliente de API (consultarSalud...)
src/components/  piezas de UI (archivos en PascalCase: EstadoServidor.tsx)
src/features/    lobby/ y partida/ (tablero, mano, comercio...)
```

- Alias `@/*` → `src/*`. Aquí sí se usa: Next resuelve los imports con su bundler.
- **Server Components por defecto.** `'use client'` solo si hay estado, efectos o eventos.
- Los tests viven junto al código (`*.test.ts` / `*.test.tsx`). El umbral del 80 % de cobertura
  aplica a `src/config` y `src/lib`; los componentes se prueban por comportamiento.
- Los tests mockean `@/lib/api` con `vi.mock`; nunca llaman al backend real.
- **Datos externos** (respuestas del backend, parámetros de URL) se validan con Zod.
- `cacheComponents` y `partialPrefetching` están **desactivados a propósito** (no aportan a un
  juego en tiempo real). No se usa `next/font`: el build no debe depender de descargar fuentes.
- `output: 'standalone'` (en `next.config.ts`) genera el servidor mínimo que usa la imagen de
  Docker. No quitarlo sin actualizar el `Dockerfile`.

## Arquitectura decidida (2026-11-04)

**Capas por funcionalidad** con **cliente ligero**: el navegador dibuja el estado que manda el
servidor y no decide nada del juego.

```
app/  ─▶  features/  ─▶  components/  ─▶  lib/  ─▶  config/
```

Una capa solo importa de las que están a su derecha.

**Las hace cumplir el lint** (`no-restricted-imports` en `oxlint.json`, probado con archivos buenos
y malos):

- `config/` no importa React, Next ni ninguna otra capa.
- `lib/` no importa React, Next, `components/`, `features/` ni `app/`: es lógica pura.
- `components/` no importa `features/` ni `app/`.
- `features/` no importa `app/`, ni otra feature con el alias `@/features/...`.

**Solo por revisión** (el lint no las detecta): entre features no se importa con rutas relativas
(`../otra/...`); `app/` solo rutea y compone; los componentes nunca abren sockets.

Estado del cliente (se instala cuando haga falta, no antes):

- **Store espejo** (Zustand): refleja el estado o los parches que manda el servidor; la UI es
  función del store.
- **Máquina de estados de interfaz** (XState) sobre el store: conectando, reconectando, mi turno,
  esperando, descarte, comercio. Evita acciones ilegales en la pantalla.
- `socket.io-client` vive en `lib/`.
- **Alternativa abierta:** cola de eventos + reductor compartido (animaciones fieles de dados y
  cartas). Exige compartir `core` entre repos (paquete privado) y un backend con registro de
  eventos. No se decide hasta que exista `core/` en el backend.

## Convenciones

- Términos técnicos y estructurales en inglés (`config`, `lib`, `components`, `features`).
- Dominio del juego en español (`tablero`, `casilla`, `camino`, `poblado`, `mano`).
- Comentarios, textos de interfaz, errores, docs y commits en español.
- Componentes: `type Props`, props desestructuradas, sin `React.FC`, sin clases.
- Hooks: `useEffect` solo para sincronizar con sistemas externos; toda petición se cancela al
  desmontar (`AbortController`).

## Accesibilidad (requisito, no extra)

- HTML semántico primero (`<output>`, `<button>`, `<main>`), no `div` con `role`.
- El color nunca es la única señal: siempre acompaña texto o icono.
- Todo se maneja con teclado y tiene nombre accesible. oxlint (`jsx-a11y`) lo hace cumplir.

## Trampas conocidas

- **El zoom y el arrastre del tablero deben seguir fluidos.** Pintar el `<svg>` en cada paso es lo que
  cuesta (medido en Chrome: de ~24 a ~70 fps con los cambios de abajo). Por eso: el `<svg>` **no lleva
  sombra CSS** (`filter`/`drop-shadow` obliga a repintarlo entero); mientras dura un gesto `useZoom` le
  pone la clase `tablero-en-gesto`, que apaga el suavizado de formas (`globals.css`); y las imágenes
  SVG del tablero se convierten a mapas de bits una sola vez (`src/lib/bitmaps.ts`), porque una
  `<image>` con un SVG dentro se vuelve a dibujar completa con cada cambio de escala. Para medir:
  `PerformanceObserver` de `long-animation-frame` mientras se simulan ruedas, alternando variantes.
- **Todo debe funcionar de 320 px a 1920 px** (teléfono vertical y horizontal, tablet, portátil y escritorio). En la
  partida hay tres repartos: una columna con pie fijo (menos de `lg`, 1024 px), dos columnas con la lateral de
  24 rem (`lg` en adelante) y la variante `apaisado` de `globals.css` (horizontal, hasta 512 px de alto y menos
  de 1024 de ancho: tablero a toda la altura y a la derecha el pie con la mano y los controles, y debajo banco y
  registro). Al tocar la pantalla de partida hay que revisarla en 375×667, 667×375, 768×1024, 1024×768 y
  1920×1080. **Trampa:** un `sr-only` (posición absoluta) dentro de una lista con `overflow-x-auto` escapa del
  recorte si la lista no es `relative` y ensancha toda la pantalla (la tira de jugadores lo hacía). Las zonas
  táctiles miden al menos 40 px (en controles pequeños con `pointer-coarse:`) y el texto legible, 12 px.
  En teléfono vertical el tablero y el pie (mano y botones) se reparten la altura de la pantalla y el banco y el
  registro quedan debajo; los paneles que antes eran globos (comercio) son hojas `fixed` por debajo de `lg`. Un
  `backdrop-filter` en un ancestro vuelve a ese ancestro el contenedor de los `fixed`. Los globos `Ayuda` se
  recolocan solos para no salirse. Al revisar, **abrir** los paneles (comerciar, ayudas, diálogos) y medir sus cajas.
- **Los puertos deben verse bien en los 15 mapas**, también los irregulares (lagos, canales, islas):
  `posicionDePuerto` saca el barco hacia afuera de la casilla de su arista (no desde el centro del
  tablero) y lo acerca a la costa si al otro lado hay otra casilla. Al tocar eso, revisar los mapas
  `remolino`, `lucha`, `fiebre-del-oro`, `reino-unido` y `tierra`.

- **TypeScript fijado en 6** y `@types/node` en 24 (= Node 24). Dependabot ignora esos saltos
  mayores. No está comprobado que Next 16 funcione bien con TS 7.
- **pnpm 11 bloquea los scripts de instalación.** Aprobar por nombre en `pnpm-workspace.yaml`,
  nunca `--all`. `sharp` está en `false` a propósito (no se usa `next/image` todavía).
- **Next lee `NEXT_PUBLIC_*` solo una por una** (`process.env.NEXT_PUBLIC_X`); pasar `process.env`
  entero a Zod no funciona en el navegador. Sin `NEXT_PUBLIC_API_URL` el build falla a propósito.
- **Docker:** `NEXT_PUBLIC_API_URL` se incrusta en el JavaScript durante el build, así que la imagen
  queda atada a esa URL. Se pasa con `--build-arg` y no tiene valor por defecto (si falta, el build
  falla a propósito). Sin corepack: la versión de pnpm está en `ARG PNPM_VERSION` y en
  `package.json`, mantenerlas iguales. `public/` tiene un `.gitkeep` porque el Dockerfile la copia
  y git no versiona carpetas vacías.
- `pnpm typecheck` ejecuta `next typegen` antes de `tsc`: sin eso faltan tipos como `LayoutProps`.
- Vite 8 resuelve los alias con `resolve.tsconfigPaths` (no hace falta `vite-tsconfig-paths`).
- Vitest y Vite se actualizan juntos (Vitest exige una versión concreta de Vite).
- **Generadores que instalan cosas de terceros** (`create-next-app`, `prisma init`...): dejan
  `AGENTS.md` o skills en el repo. No ejecutarlos sin revisar y borrar lo que agreguen.
- Windows + Git Bash: para procesos en segundo plano usar `pnpm --dir <carpeta>` (heredan mal el
  directorio) y matar por puerto con PowerShell comprobando que quedó libre.

## Seguridad

- Nunca leer, imprimir ni commitear `.env.local`. Solo se versiona `.env.example`.
- Todo lo `NEXT_PUBLIC_*` llega al navegador: nunca secretos ahí.
- Sin `dangerouslySetInnerHTML` sin sanitizar. Acciones de terceros en la CI fijadas por SHA.

## Contrato con el backend

- URL en `NEXT_PUBLIC_API_URL` (`http://localhost:3001` en local). El backend acepta CORS solo de
  los orígenes de su `FRONTEND_URL` (lista separada por comas).
- `GET /health` → `200 {"estado":"ok","baseDatos":"ok"}` o `503 {"estado":"error","baseDatos":"caida"}`
  (`src/lib/api.ts`).
- Salas por HTTP: `POST /salas`, `POST /salas/:id/unirse`, `GET /salas/:id`,
  `POST /salas/:id/empezar` (`Authorization: Bearer <token>`). **429** si una IP pasa de 20
  peticiones por minuto. Cliente en `src/lib/salas.ts`.
- **Sala de espera, lobby y portada por socket** (namespace `/lobby`, `src/lib/lobby.ts`): `suscribirSala` y
  `suscribirPortada` reemplazan al sondeo; las acciones siguen por HTTP. Los componentes no abren sockets.
- **Revancha:** `pedirRevancha` (`lib/salas.ts`) desde `PantallaFinal`: guarda la credencial nueva y va a `/sala/<nueva>`.
- Partida por socket.io: `juego:accion` (con acuse), `juego:inicio`, `juego:notificacion`,
  `juego:error`. Esquemas Zod duplicados en `src/lib/esquemas.ts`; el protocolo completo está en la
  nota `Contrato-de-Red` del vault de Obsidian.
- Rutas: `/` portada, `/jugar` lobby, `/sala/[id]` sala y partida, y las de cuenta: `/entrar`,
  `/registro`, `/recuperar`, `/perfil`. Cuentas en `src/features/cuenta/`; `src/lib/http.ts` manda
  `credentials: 'include'` en todas las peticiones (la cookie de sesión es HttpOnly: JavaScript
  nunca la ve) y `components/useCuenta.ts` pregunta quién tiene la sesión.
- Jugar desde otro dispositivo de la casa: `pnpm dev` ya escucha en `0.0.0.0` y `next.config.ts`
  permite orígenes `192.168.*.*` y `10.*.*.*`; falta poner la IP del PC en `NEXT_PUBLIC_API_URL`
  (aquí) y en `FRONTEND_URL` (backend), y abrir los puertos 3000 y 3001 en el firewall de Windows.
- **Reglas que el cliente repite solo para mostrarlas** (el servidor es quien decide): la razón de
  cambio con la banca y los puertos conectados (`src/lib/puertos.ts`, igual que
  `core/reglas/puertos.ts` del backend: 4:1 sin puerto, 3:1 con una casa en uno genérico, 2:1 con una
  casa en el de ese recurso) y la composición del mazo de desarrollo (`src/lib/mazo.ts`, igual que
  `core/reglas/mazo.ts`: 25 cartas por cada 4 jugadores). Si cambian en el backend, hay que cambiarlas aquí.
- **Piezas por jugador:** `public/piezas/<color>/{poblado,ciudad,camino}.svg` se generan con
  `pnpm piezas` a partir del arte en oro de `public/tablero/` y de la paleta de `src/lib/colores.ts`
  (16 colores). Si cambia la paleta, hay que volver a ejecutarlo; un test avisa si falta algún archivo.
- Cualquier cambio de forma de una respuesta o evento se coordina en **los dos repos**.
