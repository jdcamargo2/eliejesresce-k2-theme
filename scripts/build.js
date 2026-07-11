"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const TOKENS_PATH = path.join(ROOT_DIR, "design", "tokens.json");
const OUTPUT_PATH = path.join(ROOT_DIR, "themes", "k2-coherence.json");

const REFERENCE_PATTERN = /^\{([a-zA-Z0-9_.-]+)\}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;

function fail(message) {
  console.error(`K2 build failed: ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  let source;

  try {
    source = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${filePath}: ${error.message}`);
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

function getValueByPath(root, referencePath) {
  const segments = referencePath.split(".");
  let current = root;

  for (const segment of segments) {
    if (
      current === null ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      throw new Error(`Unknown token reference: {${referencePath}}`);
    }

    current = current[segment];
  }

  return current;
}

function resolveValue(value, root, resolutionStack = []) {
  if (Array.isArray(value)) {
    return value.map((item) =>
      resolveValue(item, root, resolutionStack)
    );
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [
        key,
        resolveValue(childValue, root, resolutionStack)
      ])
    );
  }

  if (typeof value !== "string") {
    return value;
  }

  const match = value.match(REFERENCE_PATTERN);

  if (!match) {
    return value;
  }

  const referencePath = match[1];

  if (resolutionStack.includes(referencePath)) {
    const cycle = [...resolutionStack, referencePath].join(" -> ");
    throw new Error(`Circular token reference detected: ${cycle}`);
  }

  const referencedValue = getValueByPath(root, referencePath);

  return resolveValue(
    referencedValue,
    root,
    [...resolutionStack, referencePath]
  );
}

function resolveTokens(tokens) {
  return resolveValue(tokens, tokens);
}

function assertColor(value, label) {
  if (typeof value !== "string" || !HEX_COLOR_PATTERN.test(value)) {
    throw new Error(
      `Invalid color for "${label}": ${JSON.stringify(value)}`
    );
  }

  return value.toUpperCase();
}

function createTokenColor(name, scope, foreground, fontStyle) {
  const settings = {
    foreground: assertColor(foreground, `tokenColors.${name}`)
  };

  if (fontStyle) {
    settings.fontStyle = fontStyle;
  }

  return {
    name,
    scope,
    settings
  };
}

function buildCoherenceTheme(tokens) {
  const variant = tokens.variants.coherence;
  const syntax = tokens.components.syntax;
  const brackets = tokens.components.brackets;
  const states = tokens.components.states;
  const surface = variant.surface;

  if (!variant || !surface) {
    throw new Error("Missing variants.coherence configuration");
  }

  const colors = {
    "editor.background": assertColor(
      surface.editor,
      "editor.background"
    ),
    "editor.foreground": assertColor(
      syntax.foreground,
      "editor.foreground"
    ),
    "editorCursor.foreground": assertColor(
      surface.focus,
      "editorCursor.foreground"
    ),
    "editor.selectionBackground": assertColor(
      surface.selection,
      "editor.selectionBackground"
    ),
    "editor.inactiveSelectionBackground": assertColor(
      surface.selectionInactive,
      "editor.inactiveSelectionBackground"
    ),
    "editor.lineHighlightBackground": assertColor(
      surface.lineHighlight,
      "editor.lineHighlightBackground"
    ),

    "editorLineNumber.foreground": assertColor(
      tokens.semantic.contextMuted,
      "editorLineNumber.foreground"
    ),
    "editorLineNumber.activeForeground": assertColor(
      tokens.semantic.contextSecondary,
      "editorLineNumber.activeForeground"
    ),

    "editorBracketMatch.border": assertColor(
      surface.focus,
      "editorBracketMatch.border"
    ),
    "editorBracketMatch.background": assertColor(
      surface.selectionInactive,
      "editorBracketMatch.background"
    ),

    "editorBracketHighlight.foreground1": assertColor(
      brackets.orbit1,
      "editorBracketHighlight.foreground1"
    ),
    "editorBracketHighlight.foreground2": assertColor(
      brackets.orbit2,
      "editorBracketHighlight.foreground2"
    ),
    "editorBracketHighlight.foreground3": assertColor(
      brackets.orbit3,
      "editorBracketHighlight.foreground3"
    ),
    "editorBracketHighlight.foreground4": assertColor(
      brackets.orbit4,
      "editorBracketHighlight.foreground4"
    ),
    "editorBracketHighlight.foreground5": assertColor(
      brackets.orbit5,
      "editorBracketHighlight.foreground5"
    ),
    "editorBracketHighlight.foreground6": assertColor(
      brackets.orbit6,
      "editorBracketHighlight.foreground6"
    ),
    "editorBracketHighlight.unexpectedBracket.foreground": assertColor(
      brackets.unexpected,
      "editorBracketHighlight.unexpectedBracket.foreground"
    ),

    "sideBar.background": assertColor(
      surface.sidebar,
      "sideBar.background"
    ),
    "sideBar.foreground": assertColor(
      tokens.semantic.contextSecondary,
      "sideBar.foreground"
    ),
    "sideBar.border": assertColor(
      surface.border,
      "sideBar.border"
    ),

    "activityBar.background": assertColor(
      surface.activityBar,
      "activityBar.background"
    ),
    "activityBar.foreground": assertColor(
      tokens.semantic.context,
      "activityBar.foreground"
    ),
    "activityBar.inactiveForeground": assertColor(
      tokens.semantic.contextMuted,
      "activityBar.inactiveForeground"
    ),
    "activityBarBadge.background": assertColor(
      tokens.semantic.direction,
      "activityBarBadge.background"
    ),
    "activityBarBadge.foreground": assertColor(
      surface.activityBar,
      "activityBarBadge.foreground"
    ),

    "panel.background": assertColor(
      surface.panel,
      "panel.background"
    ),
    "panel.border": assertColor(
      surface.border,
      "panel.border"
    ),

    "statusBar.background": assertColor(
      surface.statusBar,
      "statusBar.background"
    ),
    "statusBar.foreground": assertColor(
      tokens.semantic.contextSecondary,
      "statusBar.foreground"
    ),
    "statusBar.debuggingBackground": assertColor(
      tokens.semantic.transformation,
      "statusBar.debuggingBackground"
    ),

    "titleBar.activeBackground": assertColor(
      surface.titleBar,
      "titleBar.activeBackground"
    ),
    "titleBar.activeForeground": assertColor(
      tokens.semantic.context,
      "titleBar.activeForeground"
    ),
    "titleBar.inactiveBackground": assertColor(
      surface.titleBar,
      "titleBar.inactiveBackground"
    ),
    "titleBar.inactiveForeground": assertColor(
      tokens.semantic.contextMuted,
      "titleBar.inactiveForeground"
    ),

    "editorWidget.background": assertColor(
      surface.overlay,
      "editorWidget.background"
    ),
    "editorWidget.border": assertColor(
      surface.border,
      "editorWidget.border"
    ),

    "editorGutter.modifiedBackground": assertColor(
      states.modified,
      "editorGutter.modifiedBackground"
    ),
    "editorGutter.addedBackground": assertColor(
      states.added,
      "editorGutter.addedBackground"
    ),
    "editorGutter.deletedBackground": assertColor(
      states.deleted,
      "editorGutter.deletedBackground"
    )
  };

  const tokenColors = [
    createTokenColor(
      "Comments",
      [
        "comment",
        "punctuation.definition.comment"
      ],
      syntax.comment,
      "italic"
    ),
    createTokenColor(
      "Control flow",
      [
        "keyword.control",
        "keyword.control.conditional",
        "keyword.control.loop",
        "keyword.control.exception",
        "keyword.control.import",
        "keyword.control.return"
      ],
      syntax.keywordControl
    ),
    createTokenColor(
      "Types",
      [
        "entity.name.type",
        "entity.name.class",
        "entity.name.interface",
        "support.type",
        "storage.type"
      ],
      syntax.type
    ),
    createTokenColor(
      "Functions",
      [
        "entity.name.function",
        "support.function",
        "variable.function"
      ],
      syntax.function
    ),
    createTokenColor(
      "Variables",
      [
        "variable",
        "meta.definition.variable"
      ],
      syntax.variable
    ),
    createTokenColor(
      "Parameters",
      [
        "variable.parameter"
      ],
      syntax.parameter
    ),
    createTokenColor(
      "Properties",
      [
        "variable.other.property",
        "support.type.property-name",
        "meta.object-literal.key"
      ],
      syntax.property
    ),
    createTokenColor(
      "Strings",
      [
        "string"
      ],
      syntax.string
    ),
    createTokenColor(
      "Numbers",
      [
        "constant.numeric"
      ],
      syntax.number
    ),
    createTokenColor(
      "Boolean values",
      [
        "constant.language.boolean"
      ],
      syntax.boolean
    ),
    createTokenColor(
      "Null values",
      [
        "constant.language.null"
      ],
      syntax.null
    ),
    createTokenColor(
      "Decorators and annotations",
      [
        "meta.decorator",
        "storage.type.annotation"
      ],
      syntax.decorator
    ),
    createTokenColor(
      "Invalid",
      [
        "invalid",
        "invalid.illegal"
      ],
      syntax.invalid
    )
  ];

  const semanticTokenColors = {
    variable: assertColor(
      syntax.variable,
      "semanticTokenColors.variable"
    ),
    "variable.readonly": assertColor(
      tokens.semantic.direction,
      "semanticTokenColors.variable.readonly"
    ),
    property: assertColor(
      syntax.property,
      "semanticTokenColors.property"
    ),
    parameter: assertColor(
      syntax.parameter,
      "semanticTokenColors.parameter"
    ),
    function: assertColor(
      syntax.function,
      "semanticTokenColors.function"
    ),
    method: assertColor(
      syntax.function,
      "semanticTokenColors.method"
    ),
    class: assertColor(
      syntax.type,
      "semanticTokenColors.class"
    ),
    interface: assertColor(
      syntax.type,
      "semanticTokenColors.interface"
    ),
    type: assertColor(
      syntax.type,
      "semanticTokenColors.type"
    ),
    typeParameter: assertColor(
      syntax.type,
      "semanticTokenColors.typeParameter"
    ),
    enumMember: assertColor(
      syntax.boolean,
      "semanticTokenColors.enumMember"
    ),
    decorator: assertColor(
      syntax.decorator,
      "semanticTokenColors.decorator"
    )
  };

  return {
    "$schema": "vscode://schemas/color-theme",
    "name": variant.name,
    "type": variant.type,
    "semanticHighlighting": true,
    colors,
    tokenColors,
    semanticTokenColors
  };
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function ensureOutputDirectory() {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), {
    recursive: true
  });
}

function run() {
  const checkOnly = process.argv.includes("--check");

  const rawTokens = readJson(TOKENS_PATH);
  const resolvedTokens = resolveTokens(rawTokens);
  const generatedTheme = buildCoherenceTheme(resolvedTokens);
  const generatedSource = serializeJson(generatedTheme);

  if (checkOnly) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      throw new Error(
        "Generated theme does not exist. Run `npm run build` first."
      );
    }

    const existingSource = fs.readFileSync(OUTPUT_PATH, "utf8");

    if (existingSource !== generatedSource) {
      throw new Error(
        "Generated theme is out of date. Run `npm run build` and commit the result."
      );
    }

    console.log("K2 themes are synchronized.");
    return;
  }

  ensureOutputDirectory();
  fs.writeFileSync(OUTPUT_PATH, generatedSource, "utf8");

  console.log(
    `Generated ${path.relative(ROOT_DIR, OUTPUT_PATH)}`
  );
}

try {
  run();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}