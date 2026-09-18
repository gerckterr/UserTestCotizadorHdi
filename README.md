# Test de usabilidad — Cotizador Auto (HDI)

Test de usabilidad no moderado, estático (HTML + CSS + JS vanilla, sin
frameworks ni build). Se sube arrastrando la carpeta a cualquier hosting
estático y las respuestas se guardan solas en una Google Sheet.

## Qué hay aquí

```
index.html                  → el test (esto es lo que se comparte con la persona que prueba)
cotizador.html               → el prototipo del cotizador que se evalúa (corre dentro de un iframe)
app.js                       → lógica del test
styles.css                   → estilos del test
logohdi.png                  → logo del header
google-apps-script/Code.gs   → backend (Google Apps Script) que recibe las respuestas
design/                       → prototipos originales de referencia (no se publican)
```

> **Nota sobre imágenes:** el cotizador original usa varias fotos e íconos
> decorativos (mascota "Hugo", fotos de ejemplo del NIV, avatares) que no
> venían incluidos en `design/` — solo el logo. Se reemplazaron por
> placeholders simples (bloques con texto) para no bloquear el flujo. El
> layout, los textos, los precios y la lógica de validación sí son fieles al
> prototipo original.

## 1. Crear la Google Sheet y pegar el Apps Script

1. Crea una Google Sheet nueva (sheets.new).
2. Menú **Extensiones → Apps Script**.
3. Borra el contenido de `Code.gs` que abre por default y pega ahí todo el
   contenido de [`google-apps-script/Code.gs`](google-apps-script/Code.gs) de este proyecto.
4. Guarda el proyecto (ícono de disco o Ctrl/Cmd+S).
5. **Implementar → Nueva implementación**.
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo** (tu cuenta).
   - Quién tiene acceso: **Cualquier usuario**.
6. Autoriza los permisos que pida Google (es tu propio script, es seguro).
7. Copia la **URL de la aplicación web** que te da al terminar (termina en `/exec`).

La primera vez que alguien complete el test, el script crea automáticamente
una hoja llamada **Respuestas** con los encabezados. Si en el futuro cambias
las preguntas del test (agregas un `id` nuevo), la próxima respuesta agrega
la columna sola — no hay que mantener la hoja a mano.

### Formato de la hoja

Una fila por participante (identificada por `session_id`), una columna por
dato:

```
session_id | fecha | nombre | dispositivo | experiencia_previa | completado | duracion_total_seg
t1_logro | t1_dif | t1_esperado | t1_compr | t1_deducible | t1_precio | t1_porque | t1_notas | t1_pantalla_alcanzada | t1_se_atoro | t1_duracion_seg
t2_logro | t2_dif | t2_campos | t2_pantalla_alcanzada | t2_se_atoro | t2_duracion_seg
t3_logro | t3_dif | t3_despues | t3_confianza | t3_pantalla_alcanzada | t3_se_atoro | t3_duracion_seg
fin_f_paso | fin_f_leng | fin_f_solo | fin_f_conf | fin_f_peor | fin_f_falto | fin_f_libre
```

El test manda el estado completo de la sesión cada vez que alguien termina
una tarea (y al cerrar/perder la pestaña), así que los abandonos a la mitad
también quedan registrados con lo que alcanzaron a contestar.

## 2. Pegar la URL del Web App

Abre [`app.js`](app.js) y edita la primera constante:

```js
const SHEETS_URL = 'PEGA_AQUI_LA_URL_DE_TU_WEB_APP';
```

Reemplázala por la URL que copiaste en el paso anterior (la que termina en
`/exec`). Si la dejas con el placeholder, el test funciona igual pero sin
guardado automático — solo queda el botón de "copiar mis respuestas" al
final.

Si el envío automático llega a fallar (por ejemplo sin internet), el test no
se rompe: sigue mostrando el botón de copiar como respaldo y un aviso
discreto en la pantalla de cierre.

## 3. Probar en local

Los navegadores bloquean `fetch` y el `iframe` cuando se abre un HTML
directamente desde el disco (`file://`), así que hay que levantar un
servidor local:

```bash
cd Test_usabilidad
python3 -m http.server 8000
```

Y abrir `http://localhost:8000/index.html`.

## 4. Publicarlo

Cualquiera de estas tres sirve — son solo la carpeta completa, sin build:

- **Netlify Drop** (https://app.netlify.com/drop): arrastras la carpeta y te
  da un link al instante, sin cuenta. Ideal para algo rápido y desechable;
  si necesitas dominio propio o volver a subir cambios cómodamente, conviene
  crear cuenta.
- **GitHub Pages**: subes la carpeta a un repo y activas Settings → Pages.
  Toma un par de minutos más en configurarse, pero el link queda estable y
  versionado con git.
- **Cloudflare Pages**: similar a Netlify (arrastrar carpeta o conectar
  repo), con CDN de Cloudflare; buena opción si ya usas Cloudflare para el
  dominio.

Para cualquiera de las tres, sube la carpeta completa (no hace falta
`design/` ni `google-apps-script/`, pero no estorban si se quedan).

## Flujo del test (resumen)

Intro → Tarea 1 (cotizar y elegir paquete) → encuesta → Tarea 2 (llenar
datos) → encuesta → Tarea 3 (pagar y confirmar) → encuesta → encuesta final
de impresión general → cierre.

El botón "Ya terminé esta tarea" se desbloquea solo cuando la persona
realmente avanzó lo suficiente en el cotizador (detectado por `postMessage`
desde `cotizador.html`, con polling del atributo `data-screen` como
respaldo). El botón "Me atoré" siempre está disponible y marca la tarea como
no lograda.
