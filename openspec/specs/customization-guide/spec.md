### Requirement: Agent-facing customization guide
The project SHALL include a `CUSTOMIZING.md` file at the repository root. The guide SHALL be structured for coding agents (Claude Code, Cursor, etc.) and cover: brand identity (name, tagline, logo, favicon), font configuration, adding languages, theme defaults, and a complete rebrand example.

#### Scenario: Agent reads guide and rebrands
- **WHEN** an agent reads `CUSTOMIZING.md`
- **THEN** it SHALL find step-by-step instructions to change the app name, logo, fonts, default theme, and add a new language — all without modifying any `.tsx` files

### Requirement: Guide references correct file paths
The guide SHALL reference the actual file paths in the repository: `src/custom/brand.json` for brand config, `public/custom/strings/{locale}.json` for string files, and `public/custom/logo.svg` for the logo.

#### Scenario: File paths are accurate
- **WHEN** an agent follows the guide's file path references
- **THEN** all referenced files SHALL exist in the repository at the specified locations

### Requirement: Complete rebrand example
The guide SHALL include a concrete example showing how to rebrand SkMeld as a different product (e.g., "OfficeDesk" for office facilities management) with a second language, including the full `brand.json` and a snippet of the translated strings file.

#### Scenario: Example is self-contained
- **WHEN** an agent reads the rebrand example
- **THEN** it SHALL be able to apply the example without referencing any other documentation
