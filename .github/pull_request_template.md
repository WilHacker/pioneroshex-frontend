## Qué cambia

<!-- Resumen corto del cambio y por qué. -->

## Cómo se probó

- [ ] `pnpm lint`, `pnpm typecheck` y `pnpm test` en verde
- [ ] Tests nuevos o actualizados para el cambio
- [ ] Probado a mano en el navegador (si aplica)

## Arquitectura

- [ ] Respeta las capas y el lint de capas pasa
- [ ] Ninguna feature importa de otra con rutas relativas; el cliente no decide nada del juego

## Accesibilidad y seguridad

- [ ] Los elementos interactivos se pueden usar con teclado y tienen nombre accesible
- [ ] El color no es la única señal (siempre va con texto o icono)
- [ ] Sin secretos en el código ni en variables `NEXT_PUBLIC_*`
- [ ] Datos externos (respuestas del backend, parámetros de URL) validados con Zod
