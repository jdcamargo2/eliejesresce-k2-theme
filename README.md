# Eliejesresce K2 Themes

A collection of five dark themes and one light theme for Visual Studio Code, designed around semantic color roles and controlled contrast.

## Variants

- **Coherence**: a balanced dark theme.
- **Vacuum**: near-black dark surfaces.
- **Dim**: an indigo-plum editor background.
- **Endurance**: dark surfaces with stronger contrast.
- **Ferro**: the shared dark syntax palette on a `#131416` editor background.
- **Ash**: a light gray theme with a `#D4D9DE` editor background and an adapted palette for the same syntax roles.

The five dark variants share Ferro's syntax colors while retaining their distinct backgrounds and surfaces. Ash adapts those roles to a light background. Existing screenshots show an earlier palette and are not representative of this version.

## Requirements and installation

Visual Studio Code 1.90 or newer is required. To install a locally packaged extension:

```bash
code --install-extension eliejesresce-k2-theme-3.0.0.vsix
```

Then choose a variant using **Preferences: Color Theme**.

## Development and tests

Node.js 22 or newer is required for development. From a source checkout:

```bash
npm ci
npm run build             # Generate themes from design tokens
npm test                  # Tests, validation, synchronization and diff report
npm run report:contrast
npm run report:diff
npx @vscode/vsce package --no-dependencies
```

## Known limitations

Syntax and semantic highlighting depend on the grammar and language provider in use. Semantic coverage has not been verified for every language, provider or token. Manual visual verification of the current six themes, including editor tokens and workbench surfaces, remains pending. Automated contrast checks cover the specified contracts, not every possible color combination.

## License

MIT © 2026 Juan Diego Guerrero Camargo. See [LICENSE](LICENSE).
