

## Fix Missing package.json Scripts

### Problem
The root `package.json` file is missing essential configuration including the `scripts` section that Lovable needs to build the project. Currently it only contains:
```json
{
  "dependencies": { ... }
}
```

### Solution
Replace the entire root `package.json` content with a properly structured file that includes all required fields.

### What Will Change

**Root package.json** - Complete restructuring to add:
- `name` and `version` fields
- `type: "module"` for ES modules support
- Required `scripts` section including:
  - `dev` - Start development server
  - `build` - Production build
  - `build:dev` - Development build (required by Lovable)
  - `preview` - Preview production build
- Proper separation of `dependencies` and `devDependencies`

### New package.json Structure
```json
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "start": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    // ... existing dependencies
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.11.0",
    "autoprefixer": "^10.4.24",
    "lovable-tagger": "^1.1.13",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.19",
    "typescript": "^5.9.3",
    "vite": "^7.3.1"
  }
}
```

### Technical Details
- Move build tools (vite, typescript, etc.) to `devDependencies`
- Keep runtime libraries in `dependencies`
- The `build:dev` script runs `vite build --mode development` which is required for Lovable's development builds

