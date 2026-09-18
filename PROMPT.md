# Tarea: convertir un prototipo de test de usabilidad en una página estática funcional (HTML + JS) que guarde respuestas en Google Sheets

## Contexto
Tengo dos prototipos hechos en HTML (están en `design/`):

- `Test de Usuario.dc.html` — el test de usabilidad no moderado: intro, 3 tareas secuenciales, encuesta por tarea, encuesta final y pantalla de cierre.
- `Cotizador Auto.dc.html` — el prototipo de cotizador de seguro de auto que se evalúa. El test lo carga dentro de un `<iframe>`.

Son **referencias de diseño**. Están escritos en un runtime propio (`support.js`, etiquetas `<x-dc>`, `<sc-for>`, `<sc-if>`, una clase `Component` con `renderVals()`). **No reutilices ese runtime y no lo copies al resultado.**

## Lo que quiero (importante: nada de frameworks)
HTML + CSS + JavaScript vanilla, sin build, sin npm, sin Next.js, sin React. Debe poder subirse arrastrando una carpeta a cualquier hosting estático y funcionar. Resultado final:

```
/index.html        → el test (lo que se comparte)
/cotizador.html    → el prototipo del cotizador, autocontenido
/app.js            → lógica del test
/styles.css        → estilos
/logohdi.png       → logo
```

- Sin dependencias externas salvo el `<link>` de Google Fonts (Nunito e Inter).
- Un solo archivo JS, legible, comentado en español, sin transpilar.
- Mobile-first: la mayoría de participantes entran desde celular. Usa `100dvh`, targets de 44px mínimo.

## Paso 1 — portar el test a HTML/JS plano
Recrea `Test de Usuario.dc.html` tal cual, pixel a pixel. Los estilos y tokens están en el `<style>` del `<helmet>` y en los `style=` inline del template: verdes `#76B82A` y `#0F7B33`, fondo `#EAEAEA`, tarjetas blancas radio 14px, header `#F7F7F7` con barra de progreso, tipografías Nunito (texto) e Inter (títulos).

Estructura del flujo (copia los copys **literalmente** del HTML; son de investigación, no los reescribas):

1. **Intro** — nombre, dispositivo, experiencia previa (array `INTRO_QS`).
2. **3 tareas**, una a la vez. Durante la tarea: barra verde arriba con kicker + título + hint fijos, y debajo el cotizador en iframe a pantalla completa. Los textos están en el array `TASKS`.
   1. Cotizar un auto, revisar la protección y elegir un paquete.
   2. Llenar sus datos.
   3. Llegar al pago y confirmar la contratación.
3. **Encuesta final** de impresión general (array `FINAL_QS`, escalas 1–5 + abiertas).
4. **Pantalla de cierre** con agradecimiento.

Comportamiento a conservar:
- **Bloqueo anti-salto**: el botón "Ya terminé esta tarea" está deshabilitado hasta que el usuario realmente avanzó en el prototipo. Hay un ranking de pantallas (`landing` 0, `auto` 1, `contacto` 2, `plan` 3, `identidad` 4, `datos` 5, `poliza` 6, `pago` 7, `listo` 8) y la pantalla mínima por tarea es 4, 6 y 8.
- **Cómo detectarlo**: hoy el prototipo hace polling leyendo `contentDocument` del iframe. Cámbialo a `postMessage`: en `cotizador.html`, cada vez que cambia de pantalla, `window.parent.postMessage({type:'screen', screen:'plan'}, '*')`; en `app.js` un `window.addEventListener('message', ...)`. Deja también el polling del atributo `data-screen` como respaldo.
- **Auto-apertura de la encuesta** al alcanzar la pantalla objetivo de la tarea (solo una vez por tarea).
- Botón **"Me atoré"** que abre la encuesta igual y marca la tarea como no completada.
- La encuesta se muestra como overlay a pantalla completa por encima del header, con botón "Volver a la tarea".
- **Persistencia local** en `localStorage`: paso actual + respuestas, para que un refresh no pierda nada.
- Validación suave: el botón de avanzar se deshabilita si falta alguna pregunta no opcional.

## Paso 2 — guardar respuestas en Google Sheets
En vez de que el participante copie y pegue sus respuestas (que es lo que hace hoy), quiero recibirlas solas en una hoja de cálculo.

- Usa **Google Apps Script como Web App** (el camino sin servidor ni backend):
  1. Escríbeme el archivo `google-apps-script/Code.gs` listo para pegar en script.google.com, con un `doPost(e)` que reciba JSON y escriba una fila en la hoja.
  2. Deploy como Web App con acceso "Cualquiera" y `POST` desde el test.
  3. Desde `app.js` manda el POST con `fetch` en modo `no-cors` y `Content-Type: text/plain` (así se evita el preflight CORS, que es el error clásico aquí). El body es un JSON string.
- **Guardado incremental, no solo al final**: manda el estado completo de la sesión cada vez que el participante termina una tarea, y también al cerrar. Cada sesión tiene un `sessionId` (guardado en `localStorage`) y el script **actualiza la fila existente** de ese id en lugar de crear filas nuevas. Mucha gente abandona a medio test y esos datos importan.
- **Formato de la hoja**: una fila por participante, una columna por dato:
  `session_id | fecha | nombre | dispositivo | experiencia_previa | completado | duracion_total_seg`
  luego, por cada tarea: `t1_logro | t1_dificultad | t1_...` etc. (una columna por cada `id` de pregunta de cada tarea, prefijado con el namespace `intro`/`t1`/`t2`/`t3`/`fin`), más `t1_pantalla_alcanzada`, `t1_se_atoro`, `t1_duracion_seg`.
  El script debe crear los encabezados automáticamente la primera vez y agregar columnas nuevas si aparece un `id` que no existía, para que no tenga que mantener la hoja a mano.
- **Fallback**: si el POST falla, no rompas el flujo. Conserva el botón actual de "copiar mis respuestas" en la pantalla de cierre y muestra un avisito discreto solo si el envío no se logró.
- La URL del Web App va en una constante arriba de `app.js` (`const SHEETS_URL = '...'`), fácil de cambiar.

## Paso 3 — publicarlo
Dame las instrucciones concretas para lo más rápido, y explícame los trade-offs en dos líneas:
- **Netlify Drop** (arrastrar la carpeta, link inmediato, dominio custom opcional), o
- **GitHub Pages** (repo + Settings → Pages), o
- **Cloudflare Pages**.

Deja un `README.md` con: cómo crear la hoja y pegar el Apps Script, dónde pegar la URL del Web App, cómo subir la carpeta, y cómo probar en local (`python3 -m http.server`, porque el iframe y el `fetch` no funcionan bien con `file://`).

## Cómo quiero que trabajes
1. Lee los dos HTML completos primero y extrae copys, colores, tipografías y la lógica de detección de pantallas.
2. Dime el plan de archivos y el formato de columnas de la hoja, y espera mi OK.
3. Implementa el test, luego el Apps Script, luego el deploy.
4. Al final: link de producción, link de la hoja, y cómo probar en local.

## No hagas
- Nada de frameworks, bundlers ni npm.
- No rescribas los textos del test ni las preguntas.
- No cambies el diseño del cotizador: es justo lo que se está evaluando.
- No pidas datos personales reales en ningún campo (es una simulación).
- No agregues analytics ni scripts de terceros.
