# Silmaur Digital — web completa para tu hosting

Este paquete contiene la web comercial completa y editable, con la identidad del zorro, las tres demos y todos sus recursos locales. No necesitas npm, React, una compilación, Node ni una base de datos para publicarla. Node es opcional para ejecutar las pruebas de desarrollo.

## Publicar en cPanel, Hostinger o un hosting de archivos estáticos

1. Descomprime `Silmaur_Digital_Web_Completa.zip` en tu computadora.
2. Abre `public_html/config.js` con VS Code o un editor de texto. Completa `whatsapp` con tu número comercial, incluido el código de país y sin espacios. Completa `email` si quieres habilitar también el correo. Los campos están vacíos para evitar publicar datos inventados.
3. Guarda una copia de los archivos que ya tengas en la carpeta web de tu hosting, si corresponde.
4. Entra al administrador de archivos del hosting o usa SFTP. Abre la carpeta que sirve tu dominio: suele llamarse `public_html`, `www` o `htdocs`.
5. Sube **el contenido** de la carpeta `public_html` del paquete a esa carpeta del hosting. `index.html`, `config.js`, los archivos CSS/JS y `assets` deben quedar juntos. No subas la carpeta completa un nivel por debajo por accidente.
6. Si hay otro archivo de inicio anterior, como `index.php`, revisa en tu panel cuál tiene prioridad. El archivo de inicio de este sitio es `index.html`.
7. Habilita el certificado HTTPS desde el panel de tu hosting y abre tu dominio. No se incluye una redirección obligatoria para evitar errores antes de que el certificado esté configurado.
8. Comprueba una demo y prepara una solicitud. El botón de WhatsApp aparecerá al preparar el mensaje cuando hayas configurado un número válido. La web abre el mensaje; el visitante decide enviarlo.

Las rutas son relativas: también puedes publicar el contenido en una subcarpeta. No necesitas configurar rutas de una SPA ni reglas de reescritura.

## Probar antes de subir

Abre `public_html/index.html` en un navegador moderno. También puedes servir esa carpeta con cualquier servidor local. La publicación final debe hacerse por HTTPS para que funciones como copiar al portapapeles estén disponibles con normalidad. Si el navegador bloquea el portapapeles, la web selecciona el texto para copiarlo manualmente.

## Cambiar textos, colores y contacto

El archivo principal para personalizar la marca es `public_html/config.js`.

| Campo | Qué controla |
| --- | --- |
| `name` | Nombre de la marca en la cabecera y pie |
| `headline` | Primera línea del titular |
| `headlineAccent` | Segunda línea del titular |
| `description` | Descripción principal |
| `accent` | Color de acento, en formato `#RRGGBB` |
| `whatsapp` | Número comercial con código de país, solo dígitos |
| `email` | Correo comercial opcional |
| `location` | Ciudad o ubicación visible |
| `showCustomizer` | Muestra u oculta el editor de vista |

El archivo es público. No coloques contraseñas ni claves privadas.

### Editor visual incluido

Abre la dirección del sitio agregando `?editar=1` al final. Al pie aparecerá **Personalizar esta vista**. Puedes cambiar los textos, colores y contacto y pulsar **Aplicar cambios** para probarlos en ese navegador.

Para que los cambios los vean todos, pulsa **Descargar config.js**, reemplaza el archivo `config.js` del hosting y recarga la página. Si el navegador añade un número al archivo descargado, renómbralo a `config.js`. El editor no escribe en tu servidor y no es un panel de administración con autenticación.

Los demás textos, secciones, preguntas frecuentes y metadatos para redes sociales se editan en `index.html`. La fuente local y su licencia están en `assets`. Para sustituir el logotipo, conserva los nombres de los SVG o actualiza sus referencias.

## Archivos principales

| Archivo del sitio | Contenido |
| --- | --- |
| `index.html` | Página completa, contenido y formularios |
| `styles.css` | Estilos base y diseño responsivo |
| `premium.css` | Acabado visual, selector de módulos y controles de demo |
| `config.js` | Configuración pública de marca y contacto |
| `app.js` | Interacciones de la página y renderizado de paneles |
| `demo-engine.js` | Cálculos de las demos, validación y generación de CSV |
| `enhancements.js` | Selector de módulos, editor exportable y acciones adicionales |
| `assets/` | Logotipos SVG, tipografía local y licencia |

## Qué incluyen las demos

- Academia: resumen de matrículas, cargos, cobros, saldos y alumnos de muestra.
- Tienda: ventas, inventario, adelantos y cuentas pendientes.
- Ferretería: productos por unidad o metro, cantidades decimales y stock crítico.
- Registro de operaciones pagadas, pendientes o con adelanto.
- Abonos que reducen el saldo y aumentan el cobrado sin descontar stock nuevamente.
- Filtros de pagados y pendientes, reinicio y exportación de movimientos a CSV.

Los importes se guardan internamente en céntimos y las cantidades en centésimas. Las multiplicaciones se redondean al céntimo para evitar errores de punto flotante en el ejemplo.

Estas pantallas son demostraciones comerciales del frontend. No son una instalación de un ERP de producción: no incluyen autenticación, servidor de negocio, emisión de comprobantes, pasarela de pagos ni base de datos compartida. Las operaciones se conservan en la sesión de la pestaña; no se envían a un servidor. El botón **Reiniciar demo** recupera los datos iniciales de ese rubro.

El formulario de contacto prepara un mensaje para copiarlo, descargarlo o abrirlo en WhatsApp/correo. No envía datos automáticamente. No se incluye publicidad ni analítica de terceros.

## Pruebas de desarrollo opcionales

Con Node 18 o posterior, desde la carpeta descomprimida del paquete:

```bash
node --test pruebas/demo-engine.test.cjs
```

No instales dependencias. Las pruebas cubren totales, metros decimales, adelantos, abonos, stock, validaciones, CSV y recuperación de sesión. No subas `pruebas`, `extras` ni esta guía al directorio público de tu web.

## Versión anterior

`extras/Version_Anterior.zip` contiene el código de la primera versión, con su carpeta `dist`. Para restaurarla, usa el contenido de esa carpeta. La versión mejorada lista para publicar es la de `public_html`.

## Si algo no aparece

- **Página anterior:** revisa la prioridad de `index.php` y la caché del navegador, CDN o hosting.
- **Sin estilos o logo:** sube también `assets`, ambos CSS y todos los JavaScript, respetando mayúsculas y nombres.
- **Sin WhatsApp:** verifica `whatsapp` en `config.js`; el enlace se muestra después de preparar la solicitud.
- **Cambios solo en tu computadora:** descarga la configuración desde el editor y reemplaza el archivo del hosting.
- **No se ejecuta una demo:** confirma que JavaScript esté habilitado y que `demo-engine.js` cargue antes de `app.js`.

El paquete no contiene credenciales, dependencias de ChatGPT ni configuraciones de un hosting concreto.
