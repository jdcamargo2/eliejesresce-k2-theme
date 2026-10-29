# Política universal Ferro

`design/tokens.json` contiene los valores Ferro; `scripts/build.js` genera una sola lista TextMate y un solo mapa semántico para las seis variantes. Las cinco oscuras comparten los HEX Ferro; Ash conserva los roles con una paleta oscura adaptada al fondo claro. Los árboles resueltos comparten roles y reglas; Ash adapta también paleta, componentes y superficies. `buildAllThemes` aplica en las cinco variantes oscuras los colores de interfaz comunes de Coherence a primer plano, bordes e iconos. Las claves de fondo mantienen las superficies propias; los fondos de indicadores Git, badges y estados son acentos compartidos. Las seis claves `editorBracketHighlight.*` se omiten para dejar actuar a VS Code. No se solicitan estilos tipográficos.

| Rol | Color |
| --- | --- |
| Variables, propiedades, claves | #CFD5DA |
| Tipos | #FF5263 |
| Funciones | #C25CFF |
| Parámetros y receptores | #FF9638 |
| Palabras clave | #7585F9 |
| Importaciones | #0897C7 |
| Decoradores | #F16BA9 |
| Directivas | #0DA88D |
| Macros y miembros de enum | #37D9B2 |
| Números y booleanos | #A9E84C |
| Ausencia | #FFE84B |
| Cadenas y regex | #58C5F2 |
| Modificadores | #B6AD2A |
| Operadores y puntuación | #ADB6BE |
| Comentarios y documentación | #A6B2BD |

Se usan los tipos semánticos estándar y sus modificadores de VS Code, y selectores TextMate existentes; los modificadores `readonly`, `static` y `defaultLibrary` no cambian el rol. Véanse la [guía semántica](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide) y la [guía de scopes](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide). La antigua lista `legacy-textmate-duplicates.json` se conserva como registro histórico; los temas actuales no admiten duplicados.

## Límites de cobertura

La correspondencia depende de la gramática y del proveedor semántico instalados. Las pruebas de JSON y selectores no demuestran los tokens emitidos en ejecución. Las gramáticas pueden no diferenciar parámetros usados como argumentos, `self`/`cls`/`this`, `Self`, `Some`/`None`, `NULL`/`nullptr`, miembros de enum, macros, `const` como calificador, o inclusión frente a otras directivas. No se clasifican nombres por mayúsculas o escritura; cuando el proveedor no identifica el papel, el resultado es una aproximación TextMate. Las cadenas multilínea de datos permanecen azules; los docstrings reciben gris solo cuando la gramática identifica un scope de docstring. Las gramáticas pueden asignar scopes diferentes a C++ o constructores. Confirmar todos estos casos en el inspector antes de declarar la cobertura visual completa.
