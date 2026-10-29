# Contratos y verificación

El generador exige WCAG 4.5:1 para los 15 colores de sintaxis correspondientes a cada variante sobre su fondo de editor. También valida texto principal de editor, barra lateral, entradas y terminal; los contratos de estados secundarios mantienen sus umbrales anteriores. `npm run report:contrast` muestra cada par y umbral. Los contrastes se calculan con colores compuestos si hay transparencia.

`npm test` ejecuta pruebas, validación sin escritura, sincronización y `npm run report:diff`. `tests/legacy-ui-colors.json` es la referencia independiente capturada antes de la Fase 3; preserva todas las claves de color para comparar las superficies de editor, barras, paneles, menús, entradas, overlays y selección. El informe compara 78 claves de fondo por variante; indicadores de Git, badges y estados se tratan como acentos, no superficies estructurales. `tests/legacy-themes.sha256` y `design/legacy-textmate-duplicates.json` conservan la evidencia histórica sin exigir igualdad de JSON completos.

## Inspección en VS Code — NOT RUN

1. Ejecutar `npm run build` y abrir el proyecto en VS Code. Pulsar F5 para iniciar el host de desarrollo y elegir cada tema, incluidos **Ferro** y **Ash**.
2. Abrir los archivos de `fixtures/`, instalar los proveedores de lenguaje pertinentes y ejecutar **Developer: Inspect Editor Tokens and Scopes**. Inspeccionar valores, declaraciones, propiedades, receptores, importaciones, directivas, macros, documentación y ejemplos de cada lenguaje.
3. Registrar el scope, token semántico, regla y color observado. Repetir con `editor.semanticHighlighting.enabled` en `true` y en `false`; restaurar después el ajuste original.
4. Comprobar especialmente `self`, `cls`, `this`, `Self`, `Some`, `None`, `NULL`, `nullptr`, `const`, campos, `readonly`, funciones integradas, docstrings y pares de delimitadores. Los ejemplos son datos de inspección, no pruebas de analizador automatizadas.

Sin un host visual de VS Code y proveedores de lenguaje ejecutados, el resultado real de analizadores y la inspección visual permanecen **NOT RUN**.

## Ash

El editor usa `#D4D9DE`, la barra lateral `#C7CED5`, los paneles `#CDD4DB`, las superficies elevadas y la barra de actividad `#E0E4E8`, y los bordes `#A9B2BC`. Se eligieron paneles ligeramente más claros que la barra lateral para distinguirlos sin superficies blancas puras. El texto principal es `#323B45`. El botón usa `#394EB5` con texto `#E0E4E8`.

Ash conserva los quince colores propuestos sin ajustes: variable `#323B45`, tipo `#A52239`, función `#7425AC`, parámetro `#934300`, palabra clave `#394EB5`, importación `#00617A`, decorador `#A12562`, directiva `#00654F`, macro `#006852`, número `#416000`, ausencia `#725400`, cadena `#00617F`, modificador `#615800`, operador `#48525C` y comentario `#4F5B66`. Sus contrastes sobre el editor van de 4,76:1 a 8,00:1.

`tests/phase5-baseline.json` contiene huellas SHA-256 de los cinco temas completos anteriores a la fase 5, serializados como JSON con `name` eliminado. Ni la prueba ni el informe actualizan las referencias. Los temas oscuros conservan sus colores y reglas; Ash comparte selectores y clasificación con colores adaptados.
