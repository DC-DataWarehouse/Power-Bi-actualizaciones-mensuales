# Power BI · Actualizaciones mensuales

Blog en formato página web para consultar las novedades y actualizaciones mensuales de
Power BI durante 2026. Buscador, filtros por categoría e importancia, línea de tiempo,
modales de detalle y vídeos oficiales.

Publicado con GitHub Pages: rama `main` → sitio estático (sin build).

## Estructura

| Archivo | Contenido |
| --- | --- |
| `index.html` | Estructura de la página, hero, toolbar, modales. |
| `styles.css` | Estilos propios (temas claro/oscuro, glassmorphism, animaciones). |
| `app.js` | Lógica: carga `data.json`, render, filtros, buscador, modales, tema. |
| `data.json` | **Fuente de datos.** Un objeto por mes con sus `features`. |
| `images/` | Capturas de las novedades destacadas y foto de perfil. |

### Formato de `data.json`

```jsonc
{
  "id": "2026-08",
  "month": "Agosto",
  "year": 2026,
  "youtubeId": "-GcSAYvvv94",          // ID del vídeo de demos del mes
  "youtubeUrl": "https://www.youtube.com/watch?v=-GcSAYvvv94",
  "summary": "Texto introductorio del mes.",
  "metrics": { "totalFeatures": 10, "highlighted": "Titular del mes" },
  "features": [
    {
      "title": "Nombre de la novedad",
      "description": "Resumen corto.",
      "category": "Reporting",          // Reporting | Modeling | Service | AI & Copilot | Mobile | Platform
      "tags": ["Etiqueta 1", "Etiqueta 2"],
      "importance": "Alta",             // Alta | Media | Baja
      "image": "images/august_x.jpg",   // opcional
      "details": ["Viñeta 1", "Viñeta 2", "Viñeta 3"]
    }
  ]
}
```

`app.js` calcula solo las métricas del hero (meses, nº de novedades) a partir de
`data.json`; el campo `metrics` del JSON es informativo.

### Fuentes oficiales de la información

- Archivo de actualizaciones (enero–mes anterior):
  <https://learn.microsoft.com/es-es/power-bi/fundamentals/desktop-latest-update-archive?tabs=powerbi-desktop>
- Novedades del mes en curso:
  <https://learn.microsoft.com/es-es/power-bi/fundamentals/whats-new>

## Ejecutar en local

Hace falta un servidor (el `fetch` de `data.json` no funciona con `file://`):

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

---

## Tareas pendientes / próxima sesión

> Anotado el 2026-09-03. Pendiente de abordar la próxima vez que se abra el proyecto.

### 1. Automatizar la actualización mensual (GitHub Action programada)

Crear un workflow (`.github/workflows/`) que se ejecute periódicamente (p. ej. `cron`
semanal o el día 25 de cada mes) y:

1. Descargue las páginas oficiales de Microsoft Learn (archivo + novedades del mes).
2. Detecte los meses que aún no están en `data.json`.
3. Genere/actualice las entradas de esos meses en `data.json` siguiendo el formato de
   arriba (traducir títulos y descripciones al español, agrupar por categoría, asignar
   `importance`). Probablemente necesite un paso con un modelo de lenguaje para redactar
   el `summary`, las `description` y los `details`; el resultado debería **abrir un Pull
   Request** para revisión manual, no hacer push directo a `main`.
4. Complete manualmente por PR: `youtubeId` del vídeo de demos del mes e `image` de la
   novedad destacada (descargar la captura a `images/`).
5. Ejecute el build de Tailwind (ver punto 2) y confirme el CSS resultante.

### 2. Migrar Tailwind del CDN a CSS compilado

Hoy `index.html` carga `https://cdn.tailwindcss.com` (Play CDN), que:

- Descarga ~3 MB de JS y genera el CSS en el navegador en cada visita.
- Muestra un warning de "no usar en producción" en consola.
- Rompe el estilo si el CDN no está disponible.

Migración:

1. `npm init -y` y `npm i -D tailwindcss`.
2. Crear `tailwind.config.js` con `content: ["./index.html", "./app.js"]` y mover ahí la
   config que hoy está inline en `index.html` (colores `pbi`, fuentes `Inter`/`Outfit`).
3. Crear `src/input.css` con las directivas `@tailwind base; @tailwind components;
   @tailwind utilities;` y volcar `styles.css` como `@layer`.
4. Script de build: `tailwindcss -i src/input.css -o dist/styles.css --minify`.
5. En `index.html`: quitar el `<script src="cdn.tailwindcss.com">` y el `<script>` de
   `tailwind.config`, y enlazar `dist/styles.css`.
6. Integrar el build en la Action del punto 1 (y/o `npm run build` local antes de push).

### 3. Correcciones menores detectadas (2026-09-03)

- **Pill "Platform" vacía:** tras revisar `data.json` con las fuentes oficiales, ninguna
  novedad quedó en la categoría `Platform`. Reclasificar ahí los avisos generales
  (retiro del selector de archivos, controladores ODBC, PBIR como predeterminado…) o
  quitar la pill de `index.html`.
- **Métricas del hero con valores fijos:** `index.html` tiene `stat-months` = `7` y
  `stat-updates` = `0` como fallback (líneas ~106-110); actualizar a 8 o dejar que solo
  lo controle `app.js`.
- **Accesibilidad:** las `.premium-card` son `<div>` con `onclick` (no accesibles por
  teclado → añadir `role="button"`, `tabindex="0"`, Enter/Espacio); los modales no
  cierran con `Escape` ni atrapan el foco; el `<iframe>` de YouTube no tiene `title`.
- **SEO:** falta `favicon` y etiquetas Open Graph / Twitter Card.
- **Buscador:** no incluye el contenido de `details[]` (donde está la mayor parte del
  texto). Añadirlo a `matchesSearch` en `app.js`.
- **Contenido del footer:** revisar textos "David Cerón | Data Analyst" y "Clases de
  Power BI" en `index.html` (líneas ~249-250) para alinearlos con el rol actual.

---

_Portal fan-made curado por David Cerón · Data Analyst & Business Intelligence._
