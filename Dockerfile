FROM node:24-alpine AS base
# Misma versión que "packageManager" en package.json. Sin corepack: Node 25+ ya no lo incluye.
ARG PNPM_VERSION=11.25.0
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

# Dependencias + compilación
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
# NEXT_PUBLIC_* se incrusta en el JavaScript durante el build: la imagen queda atada a esta URL.
# Sin valor por defecto a propósito: si falta, la validación de src/config/env.ts rompe el build.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Imagen final ligera: solo el servidor mínimo de Next (output: 'standalone')
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
