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
  )
};

const REQUIRED_VARIANTS = [
  "coherence",
  "vacuum"
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

  return CONTRAST_CONTRACT_TEMPLATES.map(
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

function validateContrastContracts(tokens) {
  const warnings = [];
  const failures = [];

  for (const variantName of REQUIRED_VARIANTS) {
    const contracts = getContrastContracts(
      tokens,
      variantName
    );

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
        `${contract.foreground} on ${contract.background}`;

      if (contract.severity === "error") {
        failures.push(message);
      } else {
        warnings.push(message);
      }
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

function buildTheme(tokens, variantName) {
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

  const tokenColors = [
    createTokenColor(
      "Python self and cls",
      [
        "variable.language.special.self.python",
        "variable.parameter.function.language.special.self.python",
        "variable.parameter.function.language.special.cls.python"
      ],
      syntax.selfReference
    ),

    createTokenColor(
      "Python special methods",
      [
        "entity.name.function.magic.python"
      ],
      syntax.specialMethod
    ),

    createTokenColor(
      "Python built-ins",
      [
        "support.function.builtin.python",
        "support.type.python",
        "support.variable.python"
      ],
      syntax.pythonBuiltin
    ),

    createTokenColor(
      "Python exceptions",
      [
        "support.type.exception.python",
        "entity.name.type.exception.python"
      ],
      syntax.exception
    ),

    createTokenColor(
      "Python decorators",
      [
        "meta.function.decorator.python",
        "entity.name.function.decorator.python",
        "punctuation.definition.decorator.python"
      ],
      syntax.decorator
    ),
    createTokenColor(
      "Java package and import keywords",
      [
        "keyword.other.package.java",
        "keyword.control.import.java"
      ],
      syntax.import
    ),

    createTokenColor(
      "Java declaration keywords",
      [
        "storage.type.class.java",
        "storage.type.interface.java",
        "storage.type.enum.java",
        "storage.type.record.java"
      ],
      syntax.declaration
    ),
    createTokenColor(
      "Java primitive types",
      [
        "storage.type.primitive.java"
      ],
      syntax.type
    ),
    createTokenColor(
      "Java annotations",
      [
        "storage.type.annotation.java",
        "meta.declaration.annotation.java",
        "entity.name.type.annotation.java"
      ],
      syntax.decorator
    ),

    createTokenColor(
      "Java constructors",
      [
        "entity.name.function.constructor.java",
        "meta.method.identifier.java"
      ],
      syntax.constructor
    ),

    createTokenColor(
      "Java constants",
      [
        "variable.other.constant.java",
        "constant.other.java"
      ],
      syntax.constant
    ),

    createTokenColor(
      "Java primitive types",
      [
        "storage.type.primitive.java",
        "storage.type.java"
      ],
      syntax.type
    ),
    createTokenColor(
      "Import and export keywords",
      [
        "keyword.control.import",
        "keyword.control.export",
        "keyword.control.from",
        "keyword.control.as"
      ],
      syntax.import
    ),

    createTokenColor(
      "Module and package paths",
      [
        "entity.name.module",
        "support.module",
        "string.quoted.module"
      ],
      syntax.modulePath
    ),

    createTokenColor(
      "Constructors",
      [
        "entity.name.function.constructor",
        "meta.function.constructor",
        "support.class"
      ],
      syntax.constructor
    ),

    createTokenColor(
      "Built-in objects",
      [
        "support.class",
        "support.type",
        "support.variable",
        "support.constant"
      ],
      syntax.builtin
    ),

    createTokenColor(
      "Regular expressions",
      [
        "string.regexp",
        "string.regexp.js",
        "string.regexp.ts"
      ],
      syntax.regex
    ),
    createTokenColor(
      "Environment variable keys",
      [
        "variable.other.env",
        "variable.other.assignment.env",
        "entity.name.variable.env"
      ],
      syntax.environmentKey
    ),

    createTokenColor(
      "Environment variable values",
      [
        "string.unquoted.env",
        "string.quoted.double.env",
        "string.quoted.single.env"
      ],
      syntax.string
    ),
    createTokenColor(
      "YAML property keys",
      [
        "entity.name.tag.yaml",
        "meta.mapping.key.yaml string.unquoted.plain.out.yaml",
        "meta.mapping.key.yaml string.unquoted.plain.in.yaml"
      ],
      syntax.dataKey
    ),
    createTokenColor(
      "YAML plain values",
      [
        "meta.mapping.value.yaml string.unquoted.plain.out.yaml",
        "meta.mapping.value.yaml string.unquoted.plain.in.yaml",
        "meta.block.mapping.value.yaml string.unquoted.plain.out.yaml"
      ],
      syntax.dataValue
    ),
    createTokenColor(
      "YAML anchors",
      [
        "entity.name.type.anchor.yaml",
        "variable.other.anchor.yaml"
      ],
      syntax.yamlAnchor
    ),

    createTokenColor(
      "YAML aliases",
      [
        "variable.other.alias.yaml"
      ],
      syntax.yamlAlias
    ),

    createTokenColor(
      "YAML constants",
      [
        "constant.language.yaml",
        "constant.numeric.yaml"
      ],
      syntax.constant
    ),
    createTokenColor(
      "JSON property keys",
      [
        "support.type.property-name.json"
      ],
      syntax.dataKey
    ),
    createTokenColor(
      "JSON string values",
      [
        "meta.structure.dictionary.value.json string.quoted.double.json",
        "meta.structure.array.json string.quoted.double.json"
      ],
      syntax.string
    ),
    createTokenColor(
      "JSON constants",
      [
        "constant.language.json"
      ],
      syntax.constant
    ),

    createTokenColor(
      "JSON punctuation",
      [
        "punctuation.support.type.property-name.begin.json",
        "punctuation.support.type.property-name.end.json",
        "punctuation.separator.dictionary.key-value.json",
        "punctuation.separator.dictionary.pair.json"
      ],
      syntax.punctuation
    ),
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
      "Java package paths",
      [
        "meta.package.java storage.modifier.package.java"
      ],
      syntax.modulePath
    ),

    createTokenColor(
      "Java import paths",
      [
        "meta.import.java storage.modifier.import.java"
      ],
      syntax.modulePath
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
      "TypeScript declaration keywords",
      [
        "storage.type.interface.ts",
        "storage.type.class.ts",
        "storage.type.enum.ts",
        "storage.type.type.ts",
        "storage.type.namespace.ts",
        "storage.type.interface.tsx",
        "storage.type.class.tsx"
      ],
      syntax.declaration
    ),

    createTokenColor(
      "TypeScript type names",
      [
        "entity.name.type.interface.ts",
        "entity.name.type.class.ts",
        "entity.name.type.alias.ts",
        "entity.name.type.enum.ts",
        "entity.name.type.interface.tsx",
        "entity.name.type.class.tsx"
      ],
      syntax.type
    ),

    createTokenColor(
      "Rust declaration keywords",
      [
        "storage.type.struct.rust",
        "storage.type.enum.rust",
        "storage.type.trait.rust",
        "storage.type.type.rust",
        "storage.type.union.rust"
      ],
      syntax.declaration
    ),

    createTokenColor(
      "Rust types",
      [
        "entity.name.type.struct.rust",
        "entity.name.type.enum.rust",
        "entity.name.type.trait.rust",
        "entity.name.type.rust",
        "support.type.rust",
        "storage.type.numeric.rust",
        "storage.type.primitive.rust"
      ],
      syntax.type
    ),

    createTokenColor(
      "Rust functions",
      [
        "entity.name.function.rust",
        "meta.function.call.rust entity.name.function.rust"
      ],
      syntax.function
    ),

    createTokenColor(
      "Rust macros",
      [
        "entity.name.function.macro.rust",
        "support.macro.rust",
        "meta.macro.rust"
      ],
      syntax.macro
    ),

    createTokenColor(
      "Rust lifetimes",
      [
        "entity.name.type.lifetime.rust",
        "storage.modifier.lifetime.rust",
        "variable.other.lifetime.rust"
      ],
      syntax.lifetime
    ),

    createTokenColor(
      "Rust module paths",
      [
        "entity.name.namespace.rust",
        "entity.name.module.rust",
        "meta.use.rust entity.name.namespace.rust"
      ],
      syntax.modulePath
    ),

    createTokenColor(
      "Rust constants",
      [
        "variable.other.constant.rust",
        "constant.other.rust"
      ],
      syntax.constant
    ),

    createTokenColor(
      "C preprocessor directives",
      [
        "meta.preprocessor.c",
        "keyword.control.directive.c",
        "keyword.control.import.c",
        "punctuation.definition.directive.c"
      ],
      syntax.preprocessor
    ),

    createTokenColor(
      "C primitive types",
      [
        "storage.type.c",
        "storage.type.built-in.c",
        "support.type.c"
      ],
      syntax.type
    ),

    createTokenColor(
      "C functions",
      [
        "entity.name.function.c",
        "meta.function.c entity.name.function.c"
      ],
      syntax.function
    ),

    createTokenColor(
      "C constants",
      [
        "constant.other.c",
        "variable.other.constant.c"
      ],
      syntax.constant
    ),

    createTokenColor(
      "C labels",
      [
        "entity.name.label.c"
      ],
      syntax.label
    ),

    createTokenColor(
      "C header paths",
      [
        "string.quoted.other.lt-gt.include.c",
        "string.quoted.double.include.c"
      ],
      syntax.modulePath
    ),

    createTokenColor(
      "Named types",
      [
        "entity.name.type",
        "entity.name.class",
        "entity.name.interface",
        "entity.name.struct",
        "entity.name.enum",
        "support.type"
      ],
      syntax.type
    ),

    createTokenColor(
      "Type declaration keywords",
      [
        "storage.type.class",
        "storage.type.interface",
        "storage.type.struct",
        "storage.type.enum",
        "storage.type.trait",
        "storage.type.union",
        "storage.type.record"
      ],
      syntax.declaration
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
    "class:java": assertColor(
      syntax.type,
      "semanticTokenColors.class:java"
    ),
    "namespace:java": assertColor(
      syntax.modulePath,
      "semanticTokenColors.namespace:java"
    ),

    "class.defaultLibrary:java": assertColor(
      syntax.builtin,
      "semanticTokenColors.class.defaultLibrary:java"
    ),

    "type.defaultLibrary:java": assertColor(
      syntax.builtin,
      "semanticTokenColors.type.defaultLibrary:java"
    ),
      "variable.defaultLibrary:python": assertColor(
      syntax.pythonBuiltin,
      "semanticTokenColors.variable.defaultLibrary:python"
    ),

    "function.defaultLibrary:python": assertColor(
      syntax.pythonBuiltin,
      "semanticTokenColors.function.defaultLibrary:python"
    ),

    "method:python": assertColor(
      syntax.method,
      "semanticTokenColors.method:python"
    ),
    "type.declaration": assertColor(
      syntax.type,
      "semanticTokenColors.type.declaration"
    ),

    "class.declaration": assertColor(
      syntax.type,
      "semanticTokenColors.class.declaration"
    ),

    "interface.declaration": assertColor(
      syntax.type,
      "semanticTokenColors.interface.declaration"
    ),

    "struct.declaration": assertColor(
      syntax.type,
      "semanticTokenColors.struct.declaration"
    ),

    namespace: assertColor(
      syntax.modulePath,
      "semanticTokenColors.namespace"
    ),

    "variable.readonly": assertColor(
      syntax.constant,
      "semanticTokenColors.variable.readonly"
    ),

    label: assertColor(
      syntax.label,
      "semanticTokenColors.label"
    ),
    keyword: assertColor(
      syntax.keyword,
      "semanticTokenColors.keyword"
    ),

    regexp: assertColor(
      syntax.regex,
      "semanticTokenColors.regexp"
    ),

    "variable.readonly": assertColor(
      syntax.readonlyVariable,
      "semanticTokenColors.variable.readonly"
    ),

    "property.readonly": assertColor(
      syntax.dataKey,
      "semanticTokenColors.property.readonly"
    ),

    "method.static": assertColor(
      syntax.function,
      "semanticTokenColors.method.static"
    ),

    "function.static": assertColor(
      syntax.function,
      "semanticTokenColors.function.static"
    ),

    "class.defaultLibrary": assertColor(
      syntax.builtin,
      "semanticTokenColors.class.defaultLibrary"
    ),

    "type.defaultLibrary": assertColor(
      syntax.builtin,
      "semanticTokenColors.type.defaultLibrary"
    ),
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

function buildAllThemes(tokens) {
  return Object.fromEntries(
    REQUIRED_VARIANTS.map(
      (currentVariantName) => [
        currentVariantName,
        buildTheme(tokens, currentVariantName)
      ]
    )
  );
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function printContrastReport(tokens) {
  console.log("K2 contrast report:");

  for (const variantName of REQUIRED_VARIANTS) {
    const variant = tokens.variants[variantName];
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

  validateRawTokens(rawTokens);

  const resolvedTokens = resolveTokens(rawTokens);

  validateResolvedTokens(resolvedTokens);
  validateContrastContracts(resolvedTokens);

  if (reportContrast) {
    printContrastReport(resolvedTokens);
  }

  /*
   * Validation must not generate or modify theme files.
   */
  if (validateOnly) {
    console.log(
      "K2 token architecture and contrast contracts are valid."
    );
    return;
  }

  const generatedThemes = buildAllThemes(
    resolvedTokens
  );

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

try {
  run();
} catch (error) {
  fail(
    error instanceof Error
      ? error.message
      : String(error)
  );
}