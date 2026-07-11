"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const TOKENS_PATH = path.join(ROOT_DIR, "design", "tokens.json");
const OUTPUT_PATH = path.join(ROOT_DIR, "themes", "k2-coherence.json");

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

  "variants.coherence.name",
  "variants.coherence.type",
  "variants.coherence.uiTheme",
  "variants.coherence.surface.editor",
  "variants.coherence.surface.sidebar",
  "variants.coherence.surface.panel",
  "variants.coherence.surface.overlay",
  "variants.coherence.surface.border",
  "variants.coherence.surface.focusBorder"
];

const REQUIRED_COHERENCE_SURFACES = [
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

const CONTRAST_CONTRACTS = [
  {
    name: "Editor primary text",
    foreground: "components.syntax.foreground",
    background: "variants.coherence.surface.editor",
    minimum: 4.5,
    severity: "error"
  },
  {
    name: "Sidebar primary text",
    foreground: "semantic.contextSecondary",
    background: "variants.coherence.surface.sidebar",
    minimum: 4.5,
    severity: "error"
  },
  {
    name: "Input text",
    foreground: "semantic.context",
    background: "variants.coherence.surface.input",
    minimum: 4.5,
    severity: "error"
  },
  {
    name: "Quick input text",
    foreground: "semantic.context",
    background: "variants.coherence.surface.overlay",
    minimum: 4.5,
    severity: "error"
  },
  {
    name: "Button text",
    foreground: "variants.coherence.surface.activityBar",
    background: "variants.coherence.surface.button",
    minimum: 3,
    severity: "error"
  },
  {
    name: "Comments",
    foreground: "components.syntax.comment",
    background: "variants.coherence.surface.editor",
    minimum: 3,
    severity: "warning"
  },
  {
    name: "Line numbers",
    foreground: "semantic.contextFaint",
    background: "variants.coherence.surface.editor",
    minimum: 3,
    severity: "warning"
  },
  {
    name: "Ghost text",
    foreground: "semantic.contextFaint",
    background: "variants.coherence.surface.editor",
    minimum: 2.5,
    severity: "warning"
  },
  {
    name: "Inlay hints",
    foreground: "semantic.contextMuted",
    background: "variants.coherence.surface.editorElevated",
    minimum: 3,
    severity: "warning"
  }
];

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

function validateCoherenceVariant(tokens) {
  const variant = tokens.variants.coherence;

  assertPlainObject(variant, "variants.coherence");
  assertPlainObject(
    variant.surface,
    "variants.coherence.surface"
  );

  if (variant.name !== "K2 Coherence") {
    throw new Error(
      `Expected variants.coherence.name to be "K2 Coherence"`
    );
  }

  if (variant.type !== "dark") {
    throw new Error(
      `Expected variants.coherence.type to be "dark"`
    );
  }

  if (variant.uiTheme !== "vs-dark") {
    throw new Error(
      `Expected variants.coherence.uiTheme to be "vs-dark"`
    );
  }

  for (const surfaceName of REQUIRED_COHERENCE_SURFACES) {
    if (
      !Object.prototype.hasOwnProperty.call(
        variant.surface,
        surfaceName
      )
    ) {
      throw new Error(
        `Missing required Coherence surface: ` +
        `variants.coherence.surface.${surfaceName}`
      );
    }
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
  validateCoherenceVariant(tokens);
}

function validateResolvedTokens(tokens) {
  assertNoUnresolvedReferences(tokens);

  validatePalette(tokens.palette);
  validateCoherenceVariant(tokens);
}

function validateContrastContracts(tokens) {
  const warnings = [];
  const failures = [];

  for (const contract of CONTRAST_CONTRACTS) {
    const foreground = getValueByPath(
      tokens,
      contract.foreground
    );

    const background = getValueByPath(
      tokens,
      contract.background
    );

    assertColor(
      foreground,
      `contrast.${contract.name}.foreground`
    );

    assertColor(
      background,
      `contrast.${contract.name}.background`
    );

    const ratio = contrastRatio(
      foreground,
      background
    );

    const formattedRatio = ratio.toFixed(2);

    if (ratio >= contract.minimum) {
      continue;
    }

    const message =
      `${contract.name}: ${formattedRatio}:1 ` +
      `(minimum ${contract.minimum}:1) — ` +
      `${foreground} on ${background}`;

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
        ...failures.map((failure) => `  - ${failure}`)
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

function buildCoherenceTheme(tokens) {
  const variant = tokens.variants.coherence;
  const syntax = tokens.components.syntax;
  const brackets = tokens.components.brackets;
  const states = tokens.components.states;

  if (!variant || !variant.surface) {
    throw new Error("Missing variants.coherence configuration");
  }

  const surface = variant.surface;

  const colors = {
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

  const tokenColors = [
    createTokenColor(
      "Markdown headings",
      [
        "markup.heading",
        "entity.name.section",
        "markup.heading.markdown"
      ],
      syntax.markupHeading,
      "bold"
    ),

    createTokenColor(
      "Markdown heading punctuation",
      [
        "punctuation.definition.heading",
        "punctuation.definition.heading.markdown"
      ],
      syntax.keywordControl,
      "bold"
    ),

    createTokenColor(
      "Markdown bold",
      [
        "markup.bold",
        "markup.bold.markdown"
      ],
      tokens.semantic.contextStrong,
      "bold"
    ),

    createTokenColor(
      "Markdown italic",
      [
        "markup.italic",
        "markup.italic.markdown"
      ],
      syntax.markupEmphasis,
      "italic"
    ),

    createTokenColor(
      "Markdown inline code",
      [
        "markup.inline.raw",
        "markup.inline.raw.string.markdown"
      ],
      syntax.markupCode
    ),

    createTokenColor(
      "Markdown fenced code",
      [
        "markup.fenced_code.block",
        "markup.raw.block"
      ],
      syntax.markupCode
    ),

    createTokenColor(
      "Markdown quotes",
      [
        "markup.quote",
        "markup.quote.markdown"
      ],
      syntax.markupQuote,
      "italic"
    ),

    createTokenColor(
      "Markdown list punctuation",
      [
        "punctuation.definition.list",
        "punctuation.definition.list.begin.markdown",
        "punctuation.definition.list.begin"
      ],
      syntax.keywordControl
    ),

    createTokenColor(
      "Markdown links",
      [
        "markup.underline.link",
        "string.other.link",
        "meta.link.inline"
      ],
      syntax.tag
    ),
    createTokenColor(
      "CSS element selectors",
      [
        "entity.name.tag.css"
      ],
      syntax.cssSelector
    ),

    createTokenColor(
      "CSS class selectors",
      [
        "entity.other.attribute-name.class.css"
      ],
      syntax.cssSelector
    ),

    createTokenColor(
      "CSS id and pseudo selectors",
      [
        "entity.other.attribute-name.id.css",
        "entity.other.attribute-name.pseudo-class.css",
        "entity.other.attribute-name.pseudo-element.css"
      ],
      syntax.cssSelectorSpecial
    ),

    createTokenColor(
      "CSS properties",
      [
        "support.type.property-name.css",
        "meta.property-name.css"
      ],
      syntax.cssProperty
    ),

    createTokenColor(
      "CSS property values",
      [
        "support.constant.property-value.css",
        "support.constant.font-name.css",
        "support.constant.color.css",
        "constant.other.color.rgb-value.css"
      ],
      syntax.cssValue
    ),

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
      "Documentation",
      [
        "comment.block.documentation",
        "comment.line.documentation"
      ],
      syntax.documentation,
      "italic"
    ),

    createTokenColor(
      "Language keywords",
      [
        "keyword",
        "storage.modifier",
        "storage.type.function"
      ],
      syntax.keyword
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
      "Operators",
      [
        "keyword.operator",
        "keyword.operator.assignment",
        "keyword.operator.arithmetic",
        "keyword.operator.logical",
        "keyword.operator.comparison",
        "keyword.operator.accessor"
      ],
      syntax.operator
    ),

    createTokenColor(
      "Types",
      [
        "entity.name.type",
        "entity.name.class",
        "entity.name.interface",
        "entity.name.struct",
        "support.type",
        "storage.type"
      ],
      syntax.type
    ),

    createTokenColor(
      "Namespaces",
      [
        "entity.name.namespace",
        "entity.name.module",
        "support.module"
      ],
      syntax.namespace
    ),

    createTokenColor(
      "Functions",
      [
        "entity.name.function",
        "support.function",
        "variable.function",
        "meta.function-call entity.name.function"
      ],
      syntax.function
    ),

    createTokenColor(
      "Methods",
      [
        "entity.name.function.member",
        "meta.method-call entity.name.function",
        "support.function.method"
      ],
      syntax.method
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
      "Structural punctuation",
      [
        "punctuation.separator",
        "punctuation.terminator",
        "punctuation.accessor",
        "punctuation.definition.parameters",
        "punctuation.definition.typeparameters"
      ],
      syntax.punctuation
    ),

    createTokenColor(
      "HTML and XML tags",
      [
        "entity.name.tag",
        "entity.name.tag.html",
        "entity.name.tag.xml"
      ],
      syntax.tag
    ),

    createTokenColor(
      "HTML and XML attributes",
      [
        "entity.other.attribute-name",
        "entity.other.attribute-name.html",
        "entity.other.attribute-name.xml"
      ],
      syntax.attribute
    ),

    createTokenColor(
      "Tag punctuation",
      [
        "punctuation.definition.tag",
        "punctuation.definition.tag.begin",
        "punctuation.definition.tag.end"
      ],
      syntax.punctuation
    ),

    createTokenColor(
      "Template delimiters",
      [
        "punctuation.definition.template-expression",
        "punctuation.section.embedded.begin",
        "punctuation.section.embedded.end"
      ],
      syntax.keywordControl
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
      syntax.readonlyVariable,
      "semanticTokenColors.variable.readonly"
    ),

    "variable.defaultLibrary": assertColor(
      syntax.namespace,
      "semanticTokenColors.variable.defaultLibrary"
    ),

    parameter: assertColor(
      syntax.parameter,
      "semanticTokenColors.parameter"
    ),

    property: assertColor(
      syntax.property,
      "semanticTokenColors.property"
    ),

    function: assertColor(
      syntax.function,
      "semanticTokenColors.function"
    ),

    "function.defaultLibrary": assertColor(
      syntax.function,
      "semanticTokenColors.function.defaultLibrary"
    ),

    method: assertColor(
      syntax.method,
      "semanticTokenColors.method"
    ),

    macro: assertColor(
      syntax.macro,
      "semanticTokenColors.macro"
    ),

    class: assertColor(
      syntax.type,
      "semanticTokenColors.class"
    ),

    interface: assertColor(
      syntax.type,
      "semanticTokenColors.interface"
    ),

    struct: assertColor(
      syntax.type,
      "semanticTokenColors.struct"
    ),

    type: assertColor(
      syntax.type,
      "semanticTokenColors.type"
    ),

    typeParameter: assertColor(
      syntax.type,
      "semanticTokenColors.typeParameter"
    ),

    namespace: assertColor(
      syntax.namespace,
      "semanticTokenColors.namespace"
    ),

    enum: assertColor(
      syntax.type,
      "semanticTokenColors.enum"
    ),

    enumMember: assertColor(
      syntax.enumMember,
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
  const validateOnly = process.argv.includes("--validate");
  const reportContrast =
    process.argv.includes("--report-contrast");

  if (checkOnly && validateOnly) {
    throw new Error(
      "Use either --check or --validate, not both"
    );
  }

  function printContrastReport(tokens) {
  console.log("K2 contrast report:");

  for (const contract of CONTRAST_CONTRACTS) {
    const foreground = getValueByPath(
      tokens,
      contract.foreground
    );

    const background = getValueByPath(
      tokens,
      contract.background
    );

    const ratio = contrastRatio(
      foreground,
      background
    );

    const status =
      ratio >= contract.minimum ? "PASS" : "FAIL";

    console.log(
      [
        `  [${status}]`,
        contract.name,
        `${ratio.toFixed(2)}:1`,
        `minimum ${contract.minimum}:1`
      ].join(" ")
    );
  }
}

  const rawTokens = readJson(TOKENS_PATH);

  validateRawTokens(rawTokens);

  const resolvedTokens = resolveTokens(rawTokens);

  validateResolvedTokens(resolvedTokens);

  validateContrastContracts(resolvedTokens);

  if (reportContrast) {
    printContrastReport(resolvedTokens);
  }

  const generatedTheme = buildCoherenceTheme(resolvedTokens);
  const generatedSource = serializeJson(generatedTheme);

  if (validateOnly) {
    console.log(
      "K2 token architecture and contrast contracts are valid."
    );
    return;
  }

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