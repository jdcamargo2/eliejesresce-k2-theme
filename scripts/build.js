"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const TOKENS_PATH = path.join(ROOT_DIR, "design", "tokens.json");
const THEME_OUTPUTS = {
  coherence: path.join(
    ROOT_DIR,
    "themes",
    "k2-coherence.json"
  ),

  vacuum: path.join(
    ROOT_DIR,
    "themes",
    "k2-vacuum.json"
  ),

  dim: path.join(
    ROOT_DIR,
    "themes",
    "k2-dim.json"
  ),

  endurance: path.join(ROOT_DIR, "themes", "k2-endurance.json"),
  ferro: path.join(ROOT_DIR, "themes", "k2-ferro.json"),
  ash: path.join(ROOT_DIR, "themes", "k2-ash.json")
};

const REQUIRED_VARIANTS = [
  "coherence",
  "vacuum",
  "dim",
  "endurance",
  "ferro",
  "ash"
];

const REFERENCE_PATTERN = /^\{([a-zA-Z0-9_.-]+)\}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;

const REQUIRED_TOKEN_PATHS = [
  "palette.black",

  "semantic.contextStrong",
  "semantic.context",
  "semantic.contextSecondary",
  "semantic.contextMuted",
  "semantic.contextFaint",
  "semantic.direction",
  "semantic.structure",
  "semantic.transformation",
  "semantic.validData",
  "semantic.attention",
  "semantic.rupture",

  "components.debug.breakpoint",
  "components.debug.breakpointDisabled",
  "components.debug.currentLine",

  "components.testing.passed",
  "components.testing.failed",
  "components.testing.queued",
  "components.testing.skipped",
  "components.testing.runAction",
  "components.testing.passedBackground",
  "components.testing.failedBackground",
  "components.testing.queuedBackground",

  "components.syntax.foreground",
  "components.syntax.comment",
  "components.syntax.keyword",
  "components.syntax.keywordControl",
  "components.syntax.operator",
  "components.syntax.type",
  "components.syntax.function",
  "components.syntax.variable",
  "components.syntax.property",
  "components.syntax.string",
  "components.syntax.number",
  "components.syntax.invalid",

  "components.brackets.orbit1",
  "components.brackets.orbit2",
  "components.brackets.orbit3",
  "components.brackets.orbit4",
  "components.brackets.orbit5",
  "components.brackets.orbit6",
  "components.brackets.unexpected",

  "components.states.focus",
  "components.states.information",
  "components.states.modified",
  "components.states.added",
  "components.states.deleted",
  "components.states.warning",
  "components.states.error",

  "components.terminal.foreground",
  "components.terminal.cursor",
  "components.terminal.black",
  "components.terminal.brightBlack",
  "components.terminal.red",
  "components.terminal.brightRed",
  "components.terminal.green",
  "components.terminal.brightGreen",
  "components.terminal.yellow",
  "components.terminal.brightYellow",
  "components.terminal.blue",
  "components.terminal.brightBlue",
  "components.terminal.magenta",
  "components.terminal.brightMagenta",
  "components.terminal.cyan",
  "components.terminal.brightCyan",
  "components.terminal.white",
  "components.terminal.brightWhite",

  "components.diff.insertedLine",
  "components.diff.insertedText",
  "components.diff.removedLine",
  "components.diff.removedText",
  "components.diff.modifiedLine",
  "components.diff.conflict",
];

const REQUIRED_VARIANT_SURFACES = [
  "editor",
  "editorElevated",
  "sidebar",
  "sidebarSection",
  "activityBar",
  "titleBar",
  "statusBar",
  "panel",
  "overlay",
  "overlayElevated",
  "input",
  "button",
  "buttonHover",
  "border",
  "borderSubtle",
  "focusBorder",
  "selection",
  "selectionInactive",
  "lineHighlight",
  "hover",
  "active"
];

const CONTRAST_CONTRACT_TEMPLATES = [
  {
    name: "Editor primary text",
    foreground: "components.syntax.foreground",
    surface: "editor",
    minimum: 4.5,
    severity: "error"
  },
  {
    name: "Sidebar primary text",
    foreground: "semantic.contextSecondary",
    surface: "sidebar",
    minimum: 4.5,
    severity: "error"
  },
  {
    name: "Input text",
    foreground: "semantic.context",
    surface: "input",
    minimum: 4.5,
    severity: "error"
  },
  {
    name: "Quick input text",
    foreground: "semantic.context",
    surface: "overlay",
    minimum: 4.5,
    severity: "error"
  },
  {
    name: "Button text",
    foregroundSurface: "activityBar",
    surface: "button",
    minimum: 3,
    severity: "error"
  },
  {
    name: "Comments",
    foreground: "components.syntax.comment",
    surface: "editor",
    minimum: 3,
    severity: "warning"
  },
  {
    name: "Line numbers",
    foreground: "semantic.contextFaint",
    surface: "editor",
    minimum: 3,
    severity: "warning"
  },
  {
    name: "Ghost text",
    foreground: "semantic.contextFaint",
    surface: "editor",
    minimum: 2.5,
    severity: "warning"
  },
  {
    name: "Inlay hints",
    foreground: "semantic.contextMuted",
    surface: "editorElevated",
    minimum: 3,
    severity: "warning"
  },
  {
    name: "Terminal primary text",
    foreground: "components.terminal.foreground",
    surface: "panel",
    minimum: 4.5,
    severity: "error"
  },
  {
    name: "Terminal bright black",
    foreground: "components.terminal.brightBlack",
    surface: "panel",
    minimum: 3,
    severity: "warning"
  },
  {
    name: "Terminal blue",
    foreground: "components.terminal.blue",
    surface: "panel",
    minimum: 3,
    severity: "warning"
  },
  {
    name: "Terminal green",
    foreground: "components.terminal.green",
    surface: "panel",
    minimum: 3,
    severity: "warning"
  },
  {
    name: "Terminal red",
    foreground: "components.terminal.red",
    surface: "panel",
    minimum: 3,
    severity: "warning"
  }
];

function getContrastContracts(tokens, variantName) {
  const surface =
    tokens.variants[variantName].surface;

  const contracts = CONTRAST_CONTRACT_TEMPLATES.map(
    (template) => {
      const foreground = template.foreground
        ? getValueByPath(tokens, template.foreground)
        : surface[template.foregroundSurface];

      return {
        name: `${tokens.variants[variantName].name} — ${template.name}`,
        foreground,
        background: surface[template.surface],
        minimum: template.minimum,
        severity: template.severity
      };
    }
  );
  for (const [name, foreground] of Object.entries(tokens.palette).filter(([name]) => name.startsWith("ferro") && name !== "ferroBackground")) {
    contracts.push({ name: `${tokens.variants[variantName].name} — ${name.replace(/^ferro/, variantName === "ash" ? "ash" : "ferro")}`, foreground, background: surface.editor, minimum: 4.5, severity: "error" });
  }
  return contracts;
}

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

function deepMerge(baseValue, overrideValue) {
  if (overrideValue === undefined) {
    return structuredClone(baseValue);
  }

  if (
    !isPlainObject(baseValue) ||
    !isPlainObject(overrideValue)
  ) {
    return structuredClone(overrideValue);
  }

  const result = structuredClone(baseValue);

  for (const [key, value] of Object.entries(
    overrideValue
  )) {
    result[key] = Object.prototype.hasOwnProperty.call(
      baseValue,
      key
    )
      ? deepMerge(baseValue[key], value)
      : structuredClone(value);
  }

  return result;
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

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) {
    throw new Error(`Expected "${label}" to be an object`);
  }
}

function assertRequiredPaths(tokens) {
  for (const tokenPath of REQUIRED_TOKEN_PATHS) {
    getValueByPath(tokens, tokenPath);
  }
}

function validatePalette(value, currentPath = ["palette"]) {
  if (!isPlainObject(value)) {
    throw new Error("Expected \"palette\" to be an object");
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    throw new Error("Palette cannot be empty");
  }

  for (const [key, childValue] of entries) {
    const childPath = [...currentPath, key];

    if (isPlainObject(childValue)) {
      validatePalette(childValue, childPath);
      continue;
    }

    if (
      typeof childValue !== "string" ||
      !HEX_COLOR_PATTERN.test(childValue)
    ) {
      throw new Error(
        `Palette token "${childPath.join(".")}" must be a valid ` +
        `#RRGGBB or #RRGGBBAA color`
      );
    }
  }
}

function assertNoRawColorsOutsidePalette(value, currentPath = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertNoRawColorsOutsidePalette(
        item,
        [...currentPath, String(index)]
      );
    });

    return;
  }

  if (isPlainObject(value)) {
    for (const [key, childValue] of Object.entries(value)) {
      assertNoRawColorsOutsidePalette(
        childValue,
        [...currentPath, key]
      );
    }

    return;
  }

  if (
    typeof value === "string" &&
    HEX_COLOR_PATTERN.test(value) &&
    currentPath[0] !== "palette"
  ) {
    throw new Error(
      `Raw color outside palette at "${currentPath.join(".")}": ` +
      `${value}. Use a token reference instead.`
    );
  }
}

function assertNoUnresolvedReferences(value, currentPath = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertNoUnresolvedReferences(
        item,
        [...currentPath, String(index)]
      );
    });

    return;
  }

  if (isPlainObject(value)) {
    for (const [key, childValue] of Object.entries(value)) {
      assertNoUnresolvedReferences(
        childValue,
        [...currentPath, key]
      );
    }

    return;
  }

  if (
    typeof value === "string" &&
    REFERENCE_PATTERN.test(value)
  ) {
    throw new Error(
      `Unresolved token reference at "${currentPath.join(".")}": ` +
      value
    );
  }
}

function validateVariant(tokens, variantName) {
  const variantPath = `variants.${variantName}`;
  const variant = getValueByPath(tokens, variantPath);

  assertPlainObject(
    variant,
    variantPath
  );

  assertPlainObject(
    variant.surface,
    `${variantPath}.surface`
  );

  if (
    typeof variant.name !== "string" ||
    variant.name.trim() === ""
  ) {
    throw new Error(
      `Expected "${variantPath}.name" to be a non-empty string`
    );
  }

  if (!["dark", "light"].includes(variant.type)) {
    throw new Error(
      `Expected "${variantPath}.type" to be "dark" or "light"`
    );
  }

  const expectedUiTheme =
    variant.type === "light"
      ? "vs"
      : "vs-dark";

  if (variant.uiTheme !== expectedUiTheme) {
    throw new Error(
      `Expected "${variantPath}.uiTheme" to be ` +
      `"${expectedUiTheme}" for a ${variant.type} theme`
    );
  }

  for (
    const surfaceName of REQUIRED_VARIANT_SURFACES
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(
        variant.surface,
        surfaceName
      )
    ) {
      throw new Error(
        `Missing required surface: ` +
        `${variantPath}.surface.${surfaceName}`
      );
    }
  }
}

function validateVariants(tokens) {
  assertPlainObject(
    tokens.variants,
    "variants"
  );

  for (const variantName of REQUIRED_VARIANTS) {
    if (
      !Object.prototype.hasOwnProperty.call(
        tokens.variants,
        variantName
      )
    ) {
      throw new Error(
        `Missing required K2 variant: ${variantName}`
      );
    }

    validateVariant(tokens, variantName);
  }
}

function validateRawTokens(tokens) {
  assertPlainObject(tokens, "tokens");
  assertPlainObject(tokens.palette, "palette");
  assertPlainObject(tokens.semantic, "semantic");
  assertPlainObject(tokens.components, "components");
  assertPlainObject(tokens.variants, "variants");

  assertPlainObject(
    tokens.components.syntax,
    "components.syntax"
  );
  assertPlainObject(
    tokens.components.brackets,
    "components.brackets"
  );
  assertPlainObject(
    tokens.components.states,
    "components.states"
  );

  validatePalette(tokens.palette);
  assertRequiredPaths(tokens);
  assertNoRawColorsOutsidePalette(tokens);
  validateVariants(tokens);
}

function validateResolvedTokens(tokens) {
  assertNoUnresolvedReferences(tokens);

  validatePalette(tokens.palette);
  validateVariants(tokens);
}

function validateContrastContracts(
  tokens,
  variantName
) {
  const warnings = [];
  const failures = [];

  const contracts = getContrastContracts(tokens, variantName);

  for (const contract of contracts) {
    assertColor(
      contract.foreground,
      `contrast.${contract.name}.foreground`
    );

    assertColor(
      contract.background,
      `contrast.${contract.name}.background`
    );

    const ratio = contrastRatio(
      contract.foreground,
      contract.background
    );

    const formattedRatio = ratio.toFixed(2);

    if (ratio >= contract.minimum) {
      continue;
    }

    const message =
      `${contract.name}: ${formattedRatio}:1 ` +
      `(minimum ${contract.minimum}:1) — ` +
      `${contract.foreground} on ` +
      `${contract.background}`;

    if (contract.severity === "error") {
      failures.push(message);
    } else {
      warnings.push(message);
    }
  }

  if (warnings.length > 0) {
    console.warn("K2 contrast warnings:");

    for (const warning of warnings) {
      console.warn(`  - ${warning}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      [
        "Critical contrast contract failed:",
        ...failures.map(
          (failure) => `  - ${failure}`
        )
      ].join("\n")
    );
  }
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

function createVariantTokenTree(
  rawTokens,
  variantName
) {
  const variant =
    rawTokens.variants?.[variantName];

  if (!variant) {
    throw new Error(
      `Cannot resolve unknown variant: ${variantName}`
    );
  }

  const variantTokens = structuredClone(rawTokens);

  variantTokens.palette = deepMerge(rawTokens.palette, variant.paletteOverrides ?? {});

  variantTokens.semantic = deepMerge(
    rawTokens.semantic,
    variant.semanticOverrides ?? {}
  );

  variantTokens.components = deepMerge(
    rawTokens.components,
    variant.componentOverrides ?? {}
  );

  return resolveTokens(variantTokens);
}

function resolveVariantTokenTrees(rawTokens) {
  return Object.fromEntries(
    REQUIRED_VARIANTS.map((variantName) => [
      variantName,
      createVariantTokenTree(
        rawTokens,
        variantName
      )
    ])
  );
}

function assertColor(value, label) {
  if (typeof value !== "string" || !HEX_COLOR_PATTERN.test(value)) {
    throw new Error(
      `Invalid color for "${label}": ${JSON.stringify(value)}`
    );
  }

  return value.toUpperCase();
}

function hexToRgba(hexColor) {
  const normalized = hexColor.slice(1);

  if (normalized.length !== 6 && normalized.length !== 8) {
    throw new Error(
      `Unsupported color format for contrast calculation: ${hexColor}`
    );
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  const alpha =
    normalized.length === 8
      ? Number.parseInt(normalized.slice(6, 8), 16) / 255
      : 1;

  return {
    red,
    green,
    blue,
    alpha
  };
}

function compositeChannel(foreground, background, alpha) {
  return Math.round(
    foreground * alpha + background * (1 - alpha)
  );
}

function compositeColors(foregroundHex, backgroundHex) {
  const foreground = hexToRgba(foregroundHex);
  const background = hexToRgba(backgroundHex);

  if (background.alpha !== 1) {
    throw new Error(
      `Contrast background must be opaque: ${backgroundHex}`
    );
  }

  if (foreground.alpha === 1) {
    return foregroundHex;
  }

  const red = compositeChannel(
    foreground.red,
    background.red,
    foreground.alpha
  );

  const green = compositeChannel(
    foreground.green,
    background.green,
    foreground.alpha
  );

  const blue = compositeChannel(
    foreground.blue,
    background.blue,
    foreground.alpha
  );

  return `#${[red, green, blue]
    .map((channel) =>
      channel.toString(16).padStart(2, "0")
    )
    .join("")
    .toUpperCase()}`;
}

function srgbChannelToLinear(channel) {
  const normalized = channel / 255;

  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hexColor) {
  const { red, green, blue } = hexToRgba(hexColor);

  return (
    0.2126 * srgbChannelToLinear(red) +
    0.7152 * srgbChannelToLinear(green) +
    0.0722 * srgbChannelToLinear(blue)
  );
}

function contrastRatio(foregroundHex, backgroundHex) {
  const opaqueForeground = compositeColors(
    foregroundHex,
    backgroundHex
  );

  const foregroundLuminance =
    relativeLuminance(opaqueForeground);

  const backgroundLuminance =
    relativeLuminance(backgroundHex);

  const lighter = Math.max(
    foregroundLuminance,
    backgroundLuminance
  );

  const darker = Math.min(
    foregroundLuminance,
    backgroundLuminance
  );

  return (lighter + 0.05) / (darker + 0.05);
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

function semanticRulesFromEntries(entries) {
  const result = {};
  for (const [selector, value] of entries) {
    if (Object.prototype.hasOwnProperty.call(result, selector)) {
      throw new Error(`Duplicate semantic selector: ${selector}`);
    }
    result[selector] = value;
  }
  return result;
}

function buildTextMateRules(tokens) {
  const p = tokens.palette;
  const rules = [
    ["Keywords", ["keyword", "storage.type.function", "storage.type.class", "storage.type.interface", "storage.type.struct", "storage.type.enum", "storage.type.trait", "storage.type.union", "storage.type.record"], p.ferroKeyword],
    ["Modifiers", ["storage.modifier"], p.ferroModifier],
    ["Imports", ["keyword.control.import", "keyword.control.export", "keyword.control.from", "keyword.control.as", "keyword.other.package.java", "keyword.control.import.java", "keyword.control.directive.include.c", "keyword.control.directive.include.cpp", "meta.preprocessor.include.cpp punctuation.definition.directive.cpp", "string.quoted.other.lt-gt.include.c", "string.quoted.double.include.c"], p.ferroImport],
    ["Preprocessor directives", ["keyword.control.directive.c", "keyword.control.directive.define.c", "keyword.control.directive.define.cpp", "punctuation.definition.directive.c"], p.ferroPreprocessor],
    ["Types", ["entity.name.type", "entity.name.class", "entity.name.interface", "entity.name.struct", "entity.name.enum", "support.type", "support.class", "storage.type.primitive.java", "storage.type.built-in.c", "storage.type.built-in.primitive.c", "storage.type.built-in.primitive.cpp", "storage.type.numeric.rust", "storage.type.primitive.rust", "support.type.primitive.ts", "support.type.primitive.tsx", "support.type.builtin.ts", "support.type.builtin.tsx", "support.type.exception.python", "entity.name.type.exception.python"], p.ferroType],
    ["Functions", ["entity.name.function", "support.function", "variable.function", "entity.name.function.magic.python", "entity.name.function.constructor.java"], p.ferroFunction],
    ["Macros and enum members", ["entity.name.function.macro.rust", "support.macro.rust", "entity.name.constant", "variable.other.enummember", "entity.name.function.preprocessor"], p.ferroMacro],
    ["Variables and properties", ["variable", "variable.other.constant", "support.variable", "support.type.property-name", "variable.other.property", "meta.object-literal.key", "entity.name.tag.yaml", "meta.mapping.key.yaml string.unquoted.plain.out.yaml", "meta.mapping.key.yaml string.unquoted.plain.in.yaml", "entity.other.attribute-name"], p.ferroVariable],
    ["Parameters and receivers", ["variable.parameter", "variable.language.special.self.python", "variable.parameter.function.language.special.self.python", "variable.parameter.function.language.special.cls.python", "variable.language.this"], p.ferroParameter],
    ["Strings and regex", ["string", "string.regexp", "meta.mapping.value.yaml string.unquoted.plain.out.yaml", "meta.mapping.value.yaml string.unquoted.plain.in.yaml"], p.ferroString],
    ["Numbers and booleans", ["constant.numeric", "constant.language.boolean"], p.ferroNumber],
    ["Absence", ["constant.language.null", "constant.language.nullptr"], p.ferroNull],
    ["Decorators", ["entity.name.function.decorator.python", "storage.type.annotation", "entity.name.type.annotation.java"], p.ferroDecorator],
    ["Operators and punctuation", ["keyword.operator", "punctuation.separator", "punctuation.terminator", "punctuation.accessor", "punctuation.definition.parameters", "punctuation.definition.typeparameters", "punctuation.definition.tag"], p.ferroOperator],
    ["Comments and documentation", ["string.quoted.docstring.multi.python", "string.quoted.docstring.single.python", "comment", "punctuation.definition.comment", "comment.block.documentation", "comment.line.documentation"], p.ferroComment],
    ["Tags", ["entity.name.tag"], p.ferroType]
  ];
  return rules.map(([name, scopes, color]) => createTokenColor(name, scopes, color));
}

function buildSemanticRules(tokens) {
  const p = tokens.palette;
  return semanticRulesFromEntries([
    ...["variable", "variable.readonly", "variable.defaultLibrary", "property", "property.readonly"].map(s => [s, p.ferroVariable]),
    ...["parameter"].map(s => [s, p.ferroParameter]),
    ...["class", "interface", "struct", "type", "typeParameter", "enum"].map(s => [s, p.ferroType]),
    ...["function", "method"].map(s => [s, p.ferroFunction]),
    ...["macro", "enumMember"].map(s => [s, p.ferroMacro]),
    ["decorator", p.ferroDecorator], ["keyword", p.ferroKeyword],
    ["regexp", p.ferroString], ["string", p.ferroString], ["number", p.ferroNumber],
    ["comment", p.ferroComment], ["operator", p.ferroOperator], ["namespace", p.ferroVariable]
  ]);
}

function buildTheme(tokens, variantName, policy = {}) {
  const variant = tokens.variants[variantName];
  const syntax = tokens.components.syntax;
  const brackets = tokens.components.brackets;
  const states = tokens.components.states;
  const terminal = tokens.components.terminal;
  const diff = tokens.components.diff;
  const debug = tokens.components.debug;
  const testing = tokens.components.testing;

  if (!variant || !variant.surface) {
  throw new Error(
    `Missing variants.${variantName} configuration`
  );
  }

  const surface = variant.surface;

  const colors = {
    "menu.background": assertColor(
      surface.overlay,
      "menu.background"
    ),

    "menu.foreground": assertColor(
      tokens.semantic.context,
      "menu.foreground"
    ),

    "menu.selectionBackground": assertColor(
      surface.active,
      "menu.selectionBackground"
    ),

    "menu.selectionForeground": assertColor(
      tokens.semantic.contextStrong,
      "menu.selectionForeground"
    ),

    "menu.separatorBackground": assertColor(
      surface.border,
      "menu.separatorBackground"
    ),

    "commandCenter.background": assertColor(
      surface.input,
      "commandCenter.background"
    ),

    "commandCenter.foreground": assertColor(
      tokens.semantic.contextSecondary,
      "commandCenter.foreground"
    ),

    "commandCenter.activeBackground": assertColor(
      surface.active,
      "commandCenter.activeBackground"
    ),

    "commandCenter.activeForeground": assertColor(
      tokens.semantic.contextStrong,
      "commandCenter.activeForeground"
    ),

    "commandCenter.border": assertColor(
      surface.border,
      "commandCenter.border"
    ),

    "notificationCenter.border": assertColor(
      surface.border,
      "notificationCenter.border"
    ),

    "notificationCenterHeader.background": assertColor(
      surface.overlay,
      "notificationCenterHeader.background"
    ),

    "notificationCenterHeader.foreground": assertColor(
      tokens.semantic.contextStrong,
      "notificationCenterHeader.foreground"
    ),

    "notifications.background": assertColor(
      surface.overlay,
      "notifications.background"
    ),

    "notifications.foreground": assertColor(
      tokens.semantic.context,
      "notifications.foreground"
    ),

    "notifications.border": assertColor(
      surface.border,
      "notifications.border"
    ),

    "notificationLink.foreground": assertColor(
      tokens.semantic.directionStrong,
      "notificationLink.foreground"
    ),
    "scrollbar.shadow": assertColor(
      tokens.palette.black,
      "scrollbar.shadow"
    ),

    "scrollbarSlider.background": assertColor(
      tokens.palette.scrollbarThumb,
      "scrollbarSlider.background"
    ),

    "scrollbarSlider.hoverBackground": assertColor(
      tokens.palette.scrollbarThumbHover,
      "scrollbarSlider.hoverBackground"
    ),

    "scrollbarSlider.activeBackground": assertColor(
      tokens.palette.scrollbarThumbActive,
      "scrollbarSlider.activeBackground"
    ),

    "minimap.selectionHighlight": assertColor(
      tokens.palette.minimapSelection,
      "minimap.selectionHighlight"
    ),

    "minimap.errorHighlight": assertColor(
      tokens.palette.minimapError,
      "minimap.errorHighlight"
    ),

    "minimap.warningHighlight": assertColor(
      tokens.palette.minimapWarning,
      "minimap.warningHighlight"
    ),

    "minimap.infoHighlight": assertColor(
      tokens.palette.minimapInfo,
      "minimap.infoHighlight"
    ),

    "minimap.findMatchHighlight": assertColor(
      surface.selection,
      "minimap.findMatchHighlight"
    ),

    "minimapGutter.addedBackground": assertColor(
      states.added,
      "minimapGutter.addedBackground"
    ),

    "minimapGutter.modifiedBackground": assertColor(
      states.modified,
      "minimapGutter.modifiedBackground"
    ),

    "minimapGutter.deletedBackground": assertColor(
      states.deleted,
      "minimapGutter.deletedBackground"
    ),
    "peekView.border": assertColor(
      states.focus,
      "peekView.border"
    ),

    "peekViewEditor.background": assertColor(
      surface.editor,
      "peekViewEditor.background"
    ),

    "peekViewEditor.matchHighlightBackground": assertColor(
      surface.selection,
      "peekViewEditor.matchHighlightBackground"
    ),

    "peekViewResult.background": assertColor(
      surface.sidebar,
      "peekViewResult.background"
    ),

    "peekViewResult.fileForeground": assertColor(
      tokens.semantic.contextStrong,
      "peekViewResult.fileForeground"
    ),

    "peekViewResult.lineForeground": assertColor(
      tokens.semantic.contextMuted,
      "peekViewResult.lineForeground"
    ),

    "peekViewResult.matchHighlightBackground": assertColor(
      surface.selectionInactive,
      "peekViewResult.matchHighlightBackground"
    ),

    "peekViewResult.selectionBackground": assertColor(
      surface.active,
      "peekViewResult.selectionBackground"
    ),

    "peekViewResult.selectionForeground": assertColor(
      tokens.semantic.contextStrong,
      "peekViewResult.selectionForeground"
    ),

    "peekViewTitle.background": assertColor(
      surface.overlay,
      "peekViewTitle.background"
    ),

    "peekViewTitleDescription.foreground": assertColor(
      tokens.semantic.contextMuted,
      "peekViewTitleDescription.foreground"
    ),

    "peekViewTitleLabel.foreground": assertColor(
      tokens.semantic.contextStrong,
      "peekViewTitleLabel.foreground"
    ),
    "notebook.editorBackground": assertColor(
      surface.editor,
      "notebook.editorBackground"
    ),

    "notebook.cellEditorBackground": assertColor(
      surface.editorElevated,
      "notebook.cellEditorBackground"
    ),

    "notebook.cellBorderColor": assertColor(
      surface.borderSubtle,
      "notebook.cellBorderColor"
    ),

    "notebook.focusedCellBorder": assertColor(
      states.focus,
      "notebook.focusedCellBorder"
    ),

    "notebook.selectedCellBorder": assertColor(
      surface.border,
      "notebook.selectedCellBorder"
    ),

    "notebook.inactiveFocusedCellBorder": assertColor(
      surface.borderSubtle,
      "notebook.inactiveFocusedCellBorder"
    ),

    "notebook.cellStatusBarItemHoverBackground": assertColor(
      surface.hover,
      "notebook.cellStatusBarItemHoverBackground"
    ),

    "notebook.outputContainerBackgroundColor": assertColor(
      surface.panel,
      "notebook.outputContainerBackgroundColor"
    ),

    "notebookScrollbarSlider.background": assertColor(
      tokens.palette.scrollbarThumb,
      "notebookScrollbarSlider.background"
    ),

    "notebookScrollbarSlider.hoverBackground": assertColor(
      tokens.palette.scrollbarThumbHover,
      "notebookScrollbarSlider.hoverBackground"
    ),

    "notebookScrollbarSlider.activeBackground": assertColor(
      tokens.palette.scrollbarThumbActive,
      "notebookScrollbarSlider.activeBackground"
    ),
    "testing.iconPassed": assertColor(
      testing.passed,
      "testing.iconPassed"
    ),

    "testing.iconFailed": assertColor(
      testing.failed,
      "testing.iconFailed"
    ),

    "testing.iconErrored": assertColor(
      testing.failed,
      "testing.iconErrored"
    ),

    "testing.iconQueued": assertColor(
      testing.queued,
      "testing.iconQueued"
    ),

    "testing.iconSkipped": assertColor(
      testing.skipped,
      "testing.iconSkipped"
    ),

    "testing.iconUnset": assertColor(
      tokens.semantic.contextMuted,
      "testing.iconUnset"
    ),

    "testing.runAction": assertColor(
      testing.runAction,
      "testing.runAction"
    ),

    "testing.coverCountBadgeBackground": assertColor(
      surface.active,
      "testing.coverCountBadgeBackground"
    ),

    "testing.coverCountBadgeForeground": assertColor(
      tokens.semantic.contextStrong,
      "testing.coverCountBadgeForeground"
    ),

    "testing.coveredBackground": assertColor(
      testing.passedBackground,
      "testing.coveredBackground"
    ),

    "testing.uncoveredBackground": assertColor(
      testing.failedBackground,
      "testing.uncoveredBackground"
    ),
    "debugToolBar.background": assertColor(
      surface.overlay,
      "debugToolBar.background"
    ),
    "debugToolBar.border": assertColor(
      surface.border,
      "debugToolBar.border"
    ),

    "editor.stackFrameHighlightBackground": assertColor(
      debug.currentLine,
      "editor.stackFrameHighlightBackground"
    ),

    "editor.focusedStackFrameHighlightBackground": assertColor(
      surface.selectionInactive,
      "editor.focusedStackFrameHighlightBackground"
    ),

    "debugIcon.breakpointForeground": assertColor(
      debug.breakpoint,
      "debugIcon.breakpointForeground"
    ),

    "debugIcon.breakpointDisabledForeground": assertColor(
      debug.breakpointDisabled,
      "debugIcon.breakpointDisabledForeground"
    ),

    "debugIcon.breakpointCurrentStackframeForeground": assertColor(
      states.warning,
      "debugIcon.breakpointCurrentStackframeForeground"
    ),

    "debugIcon.startForeground": assertColor(
      states.added,
      "debugIcon.startForeground"
    ),

    "debugIcon.pauseForeground": assertColor(
      states.warning,
      "debugIcon.pauseForeground"
    ),

    "debugIcon.stopForeground": assertColor(
      states.error,
      "debugIcon.stopForeground"
    ),

    "debugIcon.disconnectForeground": assertColor(
      states.error,
      "debugIcon.disconnectForeground"
    ),

    "debugIcon.restartForeground": assertColor(
      states.information,
      "debugIcon.restartForeground"
    ),
    "foreground": assertColor(
      tokens.semantic.contextSecondary,
      "foreground"
    ),
    "disabledForeground": assertColor(
      tokens.semantic.contextFaint,
      "disabledForeground"
    ),
    "descriptionForeground": assertColor(
      tokens.semantic.contextMuted,
      "descriptionForeground"
    ),
    "errorForeground": assertColor(
      states.error,
      "errorForeground"
    ),
    "focusBorder": assertColor(
      surface.focusBorder,
      "focusBorder"
    ),
    "icon.foreground": assertColor(
      tokens.semantic.contextSecondary,
      "icon.foreground"
    ),
    "selection.background": assertColor(
      surface.selection,
      "selection.background"
    ),
    "widget.border": assertColor(
      surface.border,
      "widget.border"
    ),
    "widget.shadow": assertColor(
      tokens.palette.black,
      "widget.shadow"
    ),

    "window.activeBorder": assertColor(
      surface.borderSubtle,
      "window.activeBorder"
    ),
    "window.inactiveBorder": assertColor(
      surface.borderSubtle,
      "window.inactiveBorder"
    ),

    "editor.background": assertColor(
      surface.editor,
      "editor.background"
    ),
    "editor.foreground": assertColor(
      syntax.foreground,
      "editor.foreground"
    ),
    "editorCursor.foreground": assertColor(
      states.focus,
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
      tokens.semantic.contextFaint,
      "editorLineNumber.foreground"
    ),
    "editorLineNumber.activeForeground": assertColor(
      tokens.semantic.contextSecondary,
      "editorLineNumber.activeForeground"
    ),

    "editorBracketMatch.border": assertColor(
      states.focus,
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

    "editorGroup.border": assertColor(
      surface.borderSubtle,
      "editorGroup.border"
    ),
    "editorGroupHeader.tabsBackground": assertColor(
      surface.titleBar,
      "editorGroupHeader.tabsBackground"
    ),
    "editorGroupHeader.noTabsBackground": assertColor(
      surface.titleBar,
      "editorGroupHeader.noTabsBackground"
    ),

    "tab.activeBackground": assertColor(
      surface.editor,
      "tab.activeBackground"
    ),
    "tab.activeForeground": assertColor(
      tokens.semantic.contextStrong,
      "tab.activeForeground"
    ),
    "tab.activeBorderTop": assertColor(
      states.focus,
      "tab.activeBorderTop"
    ),
    "tab.inactiveBackground": assertColor(
      surface.titleBar,
      "tab.inactiveBackground"
    ),
    "tab.inactiveForeground": assertColor(
      tokens.semantic.contextMuted,
      "tab.inactiveForeground"
    ),
    "tab.unfocusedActiveForeground": assertColor(
      tokens.semantic.contextSecondary,
      "tab.unfocusedActiveForeground"
    ),
    "tab.border": assertColor(
      surface.borderSubtle,
      "tab.border"
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
    "sideBarSectionHeader.background": assertColor(
      surface.sidebarSection,
      "sideBarSectionHeader.background"
    ),
    "sideBarSectionHeader.foreground": assertColor(
      tokens.semantic.contextSecondary,
      "sideBarSectionHeader.foreground"
    ),
    "sideBarSectionHeader.border": assertColor(
      surface.borderSubtle,
      "sideBarSectionHeader.border"
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
      states.focus,
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
    "statusBarItem.errorBackground": assertColor(
      states.error,
      "statusBarItem.errorBackground"
    ),
    "statusBarItem.warningBackground": assertColor(
      states.warning,
      "statusBarItem.warningBackground"
    ),
    "statusBarItem.remoteBackground": assertColor(
      states.information,
      "statusBarItem.remoteBackground"
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

    "list.activeSelectionBackground": assertColor(
      surface.active,
      "list.activeSelectionBackground"
    ),
    "list.activeSelectionForeground": assertColor(
      tokens.semantic.contextStrong,
      "list.activeSelectionForeground"
    ),
    "list.inactiveSelectionBackground": assertColor(
      surface.hover,
      "list.inactiveSelectionBackground"
    ),
    "list.inactiveSelectionForeground": assertColor(
      tokens.semantic.context,
      "list.inactiveSelectionForeground"
    ),
    "list.hoverBackground": assertColor(
      surface.hover,
      "list.hoverBackground"
    ),
    "list.hoverForeground": assertColor(
      tokens.semantic.contextStrong,
      "list.hoverForeground"
    ),
    "list.focusBackground": assertColor(
      surface.active,
      "list.focusBackground"
    ),
    "list.focusForeground": assertColor(
      tokens.semantic.contextStrong,
      "list.focusForeground"
    ),

    "input.background": assertColor(
      surface.input,
      "input.background"
    ),
    "input.foreground": assertColor(
      tokens.semantic.context,
      "input.foreground"
    ),
    "input.border": assertColor(
      surface.border,
      "input.border"
    ),
    "input.placeholderForeground": assertColor(
      tokens.semantic.contextMuted,
      "input.placeholderForeground"
    ),
    "inputOption.activeBackground": assertColor(
      surface.active,
      "inputOption.activeBackground"
    ),
    "inputOption.activeBorder": assertColor(
      states.focus,
      "inputOption.activeBorder"
    ),

    "dropdown.background": assertColor(
      surface.overlay,
      "dropdown.background"
    ),
    "dropdown.foreground": assertColor(
      tokens.semantic.context,
      "dropdown.foreground"
    ),
    "dropdown.border": assertColor(
      surface.border,
      "dropdown.border"
    ),

    "quickInput.background": assertColor(
      surface.overlay,
      "quickInput.background"
    ),
    "quickInput.foreground": assertColor(
      tokens.semantic.context,
      "quickInput.foreground"
    ),
    "quickInputList.focusBackground": assertColor(
      surface.active,
      "quickInputList.focusBackground"
    ),
    "quickInputList.focusForeground": assertColor(
      tokens.semantic.contextStrong,
      "quickInputList.focusForeground"
    ),

    "pickerGroup.border": assertColor(
      surface.border,
      "pickerGroup.border"
    ),
    "pickerGroup.foreground": assertColor(
      tokens.semantic.structure,
      "pickerGroup.foreground"
    ),

    "button.background": assertColor(
      surface.button,
      "button.background"
    ),
    "button.foreground": assertColor(
      surface.activityBar,
      "button.foreground"
    ),
    "button.hoverBackground": assertColor(
      surface.buttonHover,
      "button.hoverBackground"
    ),

    "badge.background": assertColor(
      states.focus,
      "badge.background"
    ),
    "badge.foreground": assertColor(
      surface.activityBar,
      "badge.foreground"
    ),

    "editorWidget.background": assertColor(
      surface.overlay,
      "editorWidget.background"
    ),
    "editorWidget.border": assertColor(
      surface.border,
      "editorWidget.border"
    ),

    "editorSuggestWidget.background": assertColor(
      surface.overlay,
      "editorSuggestWidget.background"
    ),
    "editorSuggestWidget.border": assertColor(
      surface.border,
      "editorSuggestWidget.border"
    ),
    "editorSuggestWidget.foreground": assertColor(
      tokens.semantic.context,
      "editorSuggestWidget.foreground"
    ),
    "editorSuggestWidget.highlightForeground": assertColor(
      tokens.semantic.directionStrong,
      "editorSuggestWidget.highlightForeground"
    ),
    "editorSuggestWidget.selectedBackground": assertColor(
      surface.active,
      "editorSuggestWidget.selectedBackground"
    ),

    "editorHoverWidget.background": assertColor(
      surface.overlay,
      "editorHoverWidget.background"
    ),
    "editorHoverWidget.border": assertColor(
      surface.border,
      "editorHoverWidget.border"
    ),

    "editorGhostText.foreground": assertColor(
      tokens.semantic.contextFaint,
      "editorGhostText.foreground"
    ),

    "editorInlayHint.foreground": assertColor(
      tokens.semantic.contextMuted,
      "editorInlayHint.foreground"
    ),
    "editorInlayHint.background": assertColor(
      surface.editorElevated,
      "editorInlayHint.background"
    ),
    "editorInlayHint.typeForeground": assertColor(
      tokens.semantic.structure,
      "editorInlayHint.typeForeground"
    ),
    "editorInlayHint.parameterForeground": assertColor(
      tokens.semantic.contextMuted,
      "editorInlayHint.parameterForeground"
    ),

    "editorStickyScroll.background": assertColor(
      surface.editor,
      "editorStickyScroll.background"
    ),
    "editorStickyScrollHover.background": assertColor(
      surface.hover,
      "editorStickyScrollHover.background"
    ),
    "editorStickyScroll.border": assertColor(
      surface.borderSubtle,
      "editorStickyScroll.border"
    ),

    "breadcrumb.foreground": assertColor(
      tokens.semantic.contextMuted,
      "breadcrumb.foreground"
    ),
    "breadcrumb.focusForeground": assertColor(
      tokens.semantic.contextStrong,
      "breadcrumb.focusForeground"
    ),
    "breadcrumb.activeSelectionForeground": assertColor(
      tokens.semantic.directionStrong,
      "breadcrumb.activeSelectionForeground"
    ),
    "breadcrumbPicker.background": assertColor(
      surface.overlay,
      "breadcrumbPicker.background"
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
    ),
    "terminal.background": assertColor(
      surface.panel,
      "terminal.background"
    ),
    "terminal.foreground": assertColor(
      terminal.foreground,
      "terminal.foreground"
    ),
    "terminalCursor.foreground": assertColor(
      terminal.cursor,
      "terminalCursor.foreground"
    ),
    "terminalCursor.background": assertColor(
      surface.panel,
      "terminalCursor.background"
    ),

    "terminal.ansiBlack": assertColor(
      terminal.black,
      "terminal.ansiBlack"
    ),
    "terminal.ansiBrightBlack": assertColor(
      terminal.brightBlack,
      "terminal.ansiBrightBlack"
    ),

    "terminal.ansiRed": assertColor(
      terminal.red,
      "terminal.ansiRed"
    ),
    "terminal.ansiBrightRed": assertColor(
      terminal.brightRed,
      "terminal.ansiBrightRed"
    ),

    "terminal.ansiGreen": assertColor(
      terminal.green,
      "terminal.ansiGreen"
    ),
    "terminal.ansiBrightGreen": assertColor(
      terminal.brightGreen,
      "terminal.ansiBrightGreen"
    ),

    "terminal.ansiYellow": assertColor(
      terminal.yellow,
      "terminal.ansiYellow"
    ),
    "terminal.ansiBrightYellow": assertColor(
      terminal.brightYellow,
      "terminal.ansiBrightYellow"
    ),

    "terminal.ansiBlue": assertColor(
      terminal.blue,
      "terminal.ansiBlue"
    ),
    "terminal.ansiBrightBlue": assertColor(
      terminal.brightBlue,
      "terminal.ansiBrightBlue"
    ),

    "terminal.ansiMagenta": assertColor(
      terminal.magenta,
      "terminal.ansiMagenta"
    ),
    "terminal.ansiBrightMagenta": assertColor(
      terminal.brightMagenta,
      "terminal.ansiBrightMagenta"
    ),

    "terminal.ansiCyan": assertColor(
      terminal.cyan,
      "terminal.ansiCyan"
    ),
    "terminal.ansiBrightCyan": assertColor(
      terminal.brightCyan,
      "terminal.ansiBrightCyan"
    ),

    "terminal.ansiWhite": assertColor(
      terminal.white,
      "terminal.ansiWhite"
    ),
    "terminal.ansiBrightWhite": assertColor(
      terminal.brightWhite,
      "terminal.ansiBrightWhite"
    ),

    "terminal.selectionBackground": assertColor(
      surface.selection,
      "terminal.selectionBackground"
    ),

    "terminal.border": assertColor(
      surface.border,
      "terminal.border"
    ),

    "editorError.foreground": assertColor(
      states.error,
      "editorError.foreground"
    ),
    "editorError.border": assertColor(
      tokens.palette.transparent,
      "editorError.border"
    ),

    "editorWarning.foreground": assertColor(
      states.warning,
      "editorWarning.foreground"
    ),
    "editorWarning.border": assertColor(
      tokens.palette.transparent,
      "editorWarning.border"
    ),

    "editorInfo.foreground": assertColor(
      states.information,
      "editorInfo.foreground"
    ),
    "editorInfo.border": assertColor(
      tokens.palette.transparent,
      "editorInfo.border"
    ),

    "editorHint.foreground": assertColor(
      tokens.semantic.contextMuted,
      "editorHint.foreground"
    ),
    "editorHint.border": assertColor(
      tokens.palette.transparent,
      "editorHint.border"
    ),

    "problemsErrorIcon.foreground": assertColor(
      states.error,
      "problemsErrorIcon.foreground"
    ),
    "problemsWarningIcon.foreground": assertColor(
      states.warning,
      "problemsWarningIcon.foreground"
    ),
    "problemsInfoIcon.foreground": assertColor(
      states.information,
      "problemsInfoIcon.foreground"
    ),

    "diffEditor.insertedLineBackground": assertColor(
      diff.insertedLine,
      "diffEditor.insertedLineBackground"
    ),
    "diffEditor.insertedTextBackground": assertColor(
      diff.insertedText,
      "diffEditor.insertedTextBackground"
    ),

    "diffEditor.removedLineBackground": assertColor(
      diff.removedLine,
      "diffEditor.removedLineBackground"
    ),
    "diffEditor.removedTextBackground": assertColor(
      diff.removedText,
      "diffEditor.removedTextBackground"
    ),

    "diffEditor.diagonalFill": assertColor(
      surface.borderSubtle,
      "diffEditor.diagonalFill"
    ),

    "diffEditor.border": assertColor(
      surface.border,
      "diffEditor.border"
    ),

    "diffEditorGutter.insertedLineBackground": assertColor(
      states.added,
      "diffEditorGutter.insertedLineBackground"
    ),
    "diffEditorGutter.removedLineBackground": assertColor(
      states.deleted,
      "diffEditorGutter.removedLineBackground"
    ),

    "merge.currentHeaderBackground": assertColor(
      diff.modifiedLine,
      "merge.currentHeaderBackground"
    ),
    "merge.currentContentBackground": assertColor(
      surface.selectionInactive,
      "merge.currentContentBackground"
    ),

    "merge.incomingHeaderBackground": assertColor(
      diff.insertedLine,
      "merge.incomingHeaderBackground"
    ),
    "merge.incomingContentBackground": assertColor(
      diff.insertedText,
      "merge.incomingContentBackground"
    ),

    "merge.commonHeaderBackground": assertColor(
      diff.conflict,
      "merge.commonHeaderBackground"
    ),
    "merge.commonContentBackground": assertColor(
      diff.conflict,
      "merge.commonContentBackground"
    ),

    "merge.border": assertColor(
      states.warning,
      "merge.border"
    ),

    "gitDecoration.modifiedResourceForeground": assertColor(
      states.modified,
      "gitDecoration.modifiedResourceForeground"
    ),
    "gitDecoration.addedResourceForeground": assertColor(
      states.added,
      "gitDecoration.addedResourceForeground"
    ),
    "gitDecoration.deletedResourceForeground": assertColor(
      states.deleted,
      "gitDecoration.deletedResourceForeground"
    ),
    "gitDecoration.conflictingResourceForeground": assertColor(
      states.warning,
      "gitDecoration.conflictingResourceForeground"
    ),
    "gitDecoration.ignoredResourceForeground": assertColor(
      tokens.semantic.contextFaint,
      "gitDecoration.ignoredResourceForeground"
    )
  };

  let tokenColors = buildTextMateRules(tokens);
  let semanticTokenColors = buildSemanticRules(tokens);
  for (const key of Object.keys(colors)) {
    if (key.startsWith("editorBracketHighlight.")) delete colors[key];
  }
  for (const key of policy.omitColors ?? []) delete colors[key];
  if (policy.textMate) tokenColors = policy.textMate(tokenColors, tokens);
  if (policy.semantic) semanticTokenColors = semanticRulesFromEntries(policy.semantic(Object.entries(semanticTokenColors), tokens));

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

function buildAllThemes(resolvedVariantTokens, policies = {}) {
  const common = buildTheme(resolvedVariantTokens.coherence, "coherence");
  return Object.fromEntries(REQUIRED_VARIANTS.map((name) => {
    const theme = buildTheme(resolvedVariantTokens[name], name, policies[name]);
    // Backgrounds retain each variant's surfaces; all foregrounds and accents share one policy.
    for (const key of Object.keys(theme.colors)) {
      if (name !== "ash" && !key.toLowerCase().includes("background")) theme.colors[key] = common.colors[key];
    }
    return [name, theme];
  }));
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

// Legacy exceptions are exact snapshots of selector, rule position, name and settings.
function validateTextMateDuplicates(theme, exceptions = {}) {
  const occurrences = new Map();
  for (const [index, rule] of theme.tokenColors.entries()) {
    for (const scope of Array.isArray(rule.scope) ? rule.scope : [rule.scope]) {
      if (typeof scope !== "string" || !scope) throw new Error("Invalid TextMate selector");
      if (!occurrences.has(scope)) occurrences.set(scope, []);
      occurrences.get(scope).push({ index, name: rule.name, settings: rule.settings });
    }
  }
  const duplicates = Object.fromEntries([...occurrences].filter(([, rules]) => rules.length > 1));
  for (const scope of new Set([...Object.keys(duplicates), ...Object.keys(exceptions)])) {
    if (JSON.stringify(duplicates[scope]) !== JSON.stringify(exceptions[scope])) {
      throw new Error(`Unauthorized or changed duplicate TextMate selector: ${scope}`);
    }
  }
}

function validateRegistry(tokens, manifest, outputPaths, themeFiles) {
  const variants = Object.keys(tokens.variants).sort();
  const outputs = Object.keys(outputPaths).sort();
  if (JSON.stringify(variants) !== JSON.stringify(outputs) ||
      JSON.stringify(outputs) !== JSON.stringify([...REQUIRED_VARIANTS].sort())) {
    throw new Error("Variant definitions and generated outputs differ");
  }
  const entries = manifest.contributes?.themes;
  if (!Array.isArray(entries) || entries.length !== variants.length) throw new Error("Theme registrations do not match variants");
  const expectedFiles = [];
  const seenLabels = new Set();
  for (const key of variants) {
    const variant = tokens.variants[key];
    const expectedPath = `./themes/k2-${key}.json`;
    if (path.resolve(ROOT_DIR, expectedPath) !== outputPaths[key]) throw new Error(`Incorrect output path: ${key}`);
    const matches = entries.filter(entry => entry.path === expectedPath);
    if (matches.length !== 1 || matches[0].label !== variant.name || matches[0].uiTheme !== variant.uiTheme || seenLabels.has(variant.name)) {
      throw new Error(`Invalid theme registration: ${key}`);
    }
    seenLabels.add(variant.name);
    expectedFiles.push(path.basename(expectedPath));
  }
  if (JSON.stringify(expectedFiles.sort()) !== JSON.stringify([...themeFiles].sort())) {
    throw new Error("Theme files and registrations differ");
  }
}

function prepareThemes(rawTokens, manifest, themeFiles, exceptions) {
  validateRawTokens(rawTokens);
  validateRegistry(rawTokens, manifest, THEME_OUTPUTS, themeFiles);
  const resolved = resolveVariantTokenTrees(rawTokens);
  for (const name of REQUIRED_VARIANTS) {
    validateResolvedTokens(resolved[name]);
    validateContrastContracts(resolved[name], name);
  }
  const themes = buildAllThemes(resolved);
  for (const name of REQUIRED_VARIANTS) {
    validateTextMateDuplicates(themes[name]);
  }
  return { resolved, themes };
}

function printContrastReport(
  resolvedVariantTokens
) {
  console.log("K2 contrast report:");

  for (const variantName of REQUIRED_VARIANTS) {
    const tokens =
      resolvedVariantTokens[variantName];

    const variant =
      tokens.variants[variantName];

    const contracts = getContrastContracts(
      tokens,
      variantName
    );

    console.log(`\n${variant.name}:`);

    for (const contract of contracts) {
      const ratio = contrastRatio(
        contract.foreground,
        contract.background
      );

      const status =
        ratio >= contract.minimum
          ? "PASS"
          : contract.severity === "error"
            ? "FAIL"
            : "WARN";

      console.log(
        [
          `  [${status}]`,
          contract.name.replace(
            `${variant.name} — `,
            ""
          ),
          `${ratio.toFixed(2)}:1`,
          `minimum ${contract.minimum}:1`
        ].join(" ")
      );
    }
  }
}

function run() {
  const checkOnly = process.argv.includes("--check");
  const validateOnly = process.argv.includes("--validate");
  const reportContrast = process.argv.includes(
    "--report-contrast"
  );

  if (checkOnly && validateOnly) {
    throw new Error(
      "Use either --check or --validate, not both"
    );
  }

  const rawTokens = readJson(TOKENS_PATH);

  const manifest = readJson(path.join(ROOT_DIR, "package.json"));
  const exceptions = readJson(path.join(ROOT_DIR, "design", "legacy-textmate-duplicates.json"));
  const themeFiles = fs.readdirSync(path.join(ROOT_DIR, "themes")).filter(name => name.endsWith(".json"));
  const { resolved: resolvedVariantTokens, themes: generatedThemes } = prepareThemes(rawTokens, manifest, themeFiles, exceptions);

  if (reportContrast) printContrastReport(resolvedVariantTokens);
  if (validateOnly) {
    console.log("K2 token architecture, generated themes and contrast contracts are valid.");
    return;
  }

  const generatedSources = Object.fromEntries(
    Object.entries(generatedThemes).map(
      ([currentVariantName, theme]) => [
        currentVariantName,
        serializeJson(theme)
      ]
    )
  );

  if (checkOnly) {
    const outOfDateThemes = [];

    for (
      const currentVariantName of REQUIRED_VARIANTS
    ) {
      const outputPath =
        THEME_OUTPUTS[currentVariantName];

      if (!outputPath) {
        outOfDateThemes.push(
          `${currentVariantName}: output path is not configured`
        );
        continue;
      }

      if (!fs.existsSync(outputPath)) {
        outOfDateThemes.push(
          `${currentVariantName}: file does not exist`
        );
        continue;
      }

      const existingSource = fs.readFileSync(
        outputPath,
        "utf8"
      );

      if (
        existingSource !==
        generatedSources[currentVariantName]
      ) {
        outOfDateThemes.push(
          `${currentVariantName}: generated file is out of date`
        );
      }
    }

    if (outOfDateThemes.length > 0) {
      throw new Error(
        [
          "Generated themes are not synchronized:",
          ...outOfDateThemes.map(
            (item) => `  - ${item}`
          ),
          "Run `npm run build` and commit the results."
        ].join("\n")
      );
    }

    console.log("K2 themes are synchronized.");
    return;
  }

  for (
    const currentVariantName of REQUIRED_VARIANTS
  ) {
    const outputPath =
      THEME_OUTPUTS[currentVariantName];

    if (!outputPath) {
      throw new Error(
        `Missing output path for variant: ` +
        currentVariantName
      );
    }

    fs.mkdirSync(
      path.dirname(outputPath),
      { recursive: true }
    );

    fs.writeFileSync(
      outputPath,
      generatedSources[currentVariantName],
      "utf8"
    );

    console.log(
      `Generated ${path.relative(
        ROOT_DIR,
        outputPath
      )}`
    );
  }
}

if (require.main === module) {
  try { run(); } catch (error) { fail(error instanceof Error ? error.message : String(error)); }
}

module.exports = { resolveValue, resolveTokens, createVariantTokenTree, validateRawTokens,
  validateResolvedTokens, validateContrastContracts, buildTextMateRules, buildSemanticRules,
  semanticRulesFromEntries, buildTheme, buildAllThemes, serializeJson,
  resolveVariantTokenTrees, validateRegistry, validateTextMateDuplicates, prepareThemes, contrastRatio, THEME_OUTPUTS, REQUIRED_VARIANTS };
