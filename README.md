# PionerosHex · Frontend

Cliente web del juego multijugador PionerosHex (Next.js + React + TypeScript + Tailwind).
El servidor autoritativo vive en el repositorio `pioneroshex-backend`.

## Requisitos

- Node.js 24 (ver `.nvmrc`)
- pnpm (`corepack enable`)

## Puesta en marcha

```bash
pnpm install     # instala dependencias y activa los hooks de git
pnpm dev         # http://localhost:3000
```

## Comandos

| Comando                        | Qué hace                                   |
| ------------------------------ | ------------------------------------------ |
| `pnpm dev`                     | Servidor de desarrollo                     |
| `pnpm build` / `start`         | Compila y ejecuta la versión de producción |
| `pnpm lint`                    | oxlint (React, Next y accesibilidad)       |
| `pnpm format` / `format:check` | Prettier (escribir / solo verificar)       |
| `pnpm typecheck`               | Genera los tipos de Next y corre `tsc`     |
| `pnpm test` / `test:cov`       | Tests unitarios / con cobertura            |

## Ramas

Solo hay dos ramas permanentes y no se usan ramas de feature:

- **`develop`:** integración. Aquí se trabaja y se hacen los commits.
- **`main`:** producción. Solo recibe cambios de `develop` mediante pull request,
  fusionado con **merge commit** (no squash ni rebase).

## Calidad

- **pre-commit:** oxlint y prettier sobre los archivos modificados.
- **commit-msg:** commitlint. Formato `tipo: descripción`, con tipo en
  `feat, fix, refactor, docs, test, chore, perf, ci` y la descripción en español.
- **pre-push:** `typecheck` y tests.
- Cobertura mínima del 80 % sobre la lógica pura (`src/config` y `src/lib`).

## Convenciones

- Términos técnicos y estructurales en inglés (`config`, `lib`, `components`, `features`).
- Dominio del juego en español (`tablero`, `casilla`, `camino`, `poblado`, `mano`).
- Comentarios, errores, docs y commits en español.
- Alias `@/*` apunta a `src/*` (aquí sí se usa: Next resuelve los imports con su bundler).
