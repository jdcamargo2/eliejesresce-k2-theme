# Ferro — matriz de inspección manual de VS Code

Estado inicial de todas las filas: **NOT RUN**; token, modificadores, scopes, regla y color observado: **sin observar**. Las cifras son expectativas, no resultados. La igualdad estática de las reglas entre variantes no demuestra su aplicación en el editor.

## Preparación

1. Abrir este repositorio en VS Code; ejecutar «Developer: Reload Window» si se acaba de cambiar el código. Lanzar «Debug: Start Debugging» (F5) y seleccionar «Extension Development Host» si se solicita. En la ventana de desarrollo seleccionar cada uno de los temas: Coherence, Vacuum, Dim, Endurance, Ferro y Ash.
2. Para cada archivo abrir el fixture, colocar el cursor sobre el identificador y ejecutar «Developer: Inspect Editor Tokens and Scopes». Registrar versión de VS Code, extensión/proveedor y versión, archivo y línea, tema, configuración `editor.semanticHighlighting.enabled`, token semántico y modificadores, scopes TextMate, regla ganadora, color observado y PASS/FAIL/BLOCKED. Un proveedor que no emita un token no implica un fallo del tema. Esperar a que termine la inicialización del proveedor.
3. Repetir con `editor.semanticHighlighting.enabled: true` y `false` en un perfil aislado; anotar si el proveedor no está instalado o no responde. «false» comprueba la ruta TextMate, no la semántica. Evitar personalizaciones de colores y estilos del usuario que alteren el resultado.
4. Los casos no presentes abajo se pueden pegar en un archivo temporal del mismo lenguaje dentro de la ventana de desarrollo; no modificar los fixtures permanentes para obtener evidencia. Si la gramática o el proveedor no están disponibles, marcar BLOCKED y describirlo.

| Lenguaje y ubicación | Identificador/caso a inspeccionar | Esperado |
|---|---|---|
| C `state_vector.c:17,22` | `state`, declaración y uso | #CFD5DA |
| C `state_vector.c:11,12` | parámetro `value`, campo `real` tras `->` | #FF9638, #CFD5DA |
| C `state_vector.c:1,4,17` | `#include`, `#define`, `DIMENSION` declaración/uso | #0897C7, #0DA88D, #37D9B2 |
| C/C++ temporal | `int blocks;` y uso; `int store;` y `void f(int store)` | #CFD5DA / #FF9638 para parámetro |
| C++ `roles.cpp:5,7,8,11` | `const`, `ordinary`, parámetro `state`, campo `value` tras `.` | modificador #B6AD2A; gris #CFD5DA; parámetro #FF9638 |
| C++ `roles.cpp:1,3,11` | `#include`, `#define`, `LIMIT` declaración/uso | #0897C7, #0DA88D, #37D9B2 |
| Python `quantum_circuit.py:19,23,42,43` | `self`, `cls`, atributo `qubits`, `__init__` | #FF9638, #FF9638, #CFD5DA, #C25CFF |
| Python `quantum_circuit.py:10,19,38,39,47` | decorador, `None`, docstring, cadena multilínea, `len`/`str` | #F16BA9, #FFE84B, #A6B2BD, #58C5F2, #C25CFF; verificar decorador contra regla aprobada |
| Rust `quantum-state.rs:10,14,15,19` | `Self`, `self`, `amplitudes`, `len`, `Some`, `None` | #FF5263, #FF9638, #CFD5DA, #C25CFF, #37D9B2, #FFE84B |
| Rust temporal | `let mut value = 1; println!("{}", value);` | `mut` #B6AD2A; variable #CFD5DA; macro #37D9B2 |
| JS `roles.js:3,4,6,7` | `this`, `value` formal y argumento, `ordinary`, método, clave `key`, `null`, regex | #FF9638 receptor/formal; argumento según rol; gris #CFD5DA; método #C25CFF; clave #CFD5DA; #FFE84B; #58C5F2 |
| TS `web-service.ts:2,7,9,10,13` | `id` readonly, `constructor`, `async`, parámetro `id`, `this`, `null` | #CFD5DA, #C25CFF, #B6AD2A, #FF9638, #FF9638, #FFE84B |
| JS/TS temporal | `let x = undefined; const y = x;` | `undefined` #FFE84B; variables #CFD5DA; modificadores #B6AD2A |
| Java `domain-service.java:5,6,8,9` | clase, campo final, tipo, método, parámetro, `null` | #FF5263, #CFD5DA, #FF5263, #C25CFF, #FF9638, #FFE84B |
| JSON `structured-data.json:2,3,4,6` | clave, cadena, número, booleano, `null` | #CFD5DA, #58C5F2, #A9E84C, #A9E84C, #FFE84B |
| YAML `server-config.yaml:1,2,3,6` | claves, booleano, número | #CFD5DA, #A9E84C, #A9E84C |
| HTML/CSS `roles.html:2,3,4` | etiquetas, atributos, propiedad CSS `color`, valores | inspeccionar scopes y comparar con el mapa aprobado; propiedades #CFD5DA |
| Todos | comentarios/documentación, cadenas, tipos y funciones | #A6B2BD, #58C5F2, #FF5263, #C25CFF |

## Revisión visual por tema

Abrir los fixtures extensos y registrar por separado PASS/FAIL/NOT RUN para: gris estable; separación cobre/gris y rojo/violeta; comentarios largos; densidad de color; macros y valores especiales; delimitadores con colorización nativa activada; ausencia de cursiva/negrita/subrayado no aprobados; contraste perceptual sobre cada fondo. No convertir una preferencia nueva en defecto sin aprobación. Los informes numéricos de contraste no sustituyen esta revisión.
