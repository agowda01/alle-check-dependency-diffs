# Check Package Dependency Changes

A GitHub Action that detects changes to package dependency files to help you determine whether to run tasks like security dependency scanners, builds, or other dependency-related workflows.

## Features

- **Git-based detection**: Check if dependency files have been modified in your git history
- **Hash-based detection**: Compare file hashes between builds to detect changes in non-committed files
- **Flexible file matching**: Works with any package file (package-lock.json, package.json, project.assets.json, etc.)
- **Artifact storage**: Automatically stores hash records as artifacts for comparison across workflow runs

## Usage

### Check for changes via Git

This mode checks if your package file was modified in the most recent commit:

```yaml
name: Security Scan on Dependency Changes

on: [push, pull_request]

jobs:
  check-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2  # Need at least 2 commits for comparison

      - name: Check for dependency changes
        id: check-deps
        uses: your-org/check-package-dependency-changes@v1
        with:
          packages-file-name: 'package-lock.json'
          project-root-directory: '.'
          check-git: true

      - name: Run security scan
        if: steps.check-deps.outputs.dependency-changed == 'true'
        run: npm audit

      - name: Skip scan
        if: steps.check-deps.outputs.dependency-changed == 'false'
        run: echo "No dependency changes detected, skipping security scan"
```

### Check for changes via file hashes

This mode compares file hashes with previous runs, useful for files not committed to git:

```yaml
name: Check .NET Dependencies

on: [push]

jobs:
  check-dotnet-deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Restore .NET dependencies
        run: dotnet restore

      - name: Check for dependency changes
        id: check-deps
        uses: your-org/check-package-dependency-changes@v1
        with:
          packages-file-name: 'project.assets.json'
          project-root-directory: './src'
          output-file-name: 'dependency-hashes.json'
          check-directory-files: true

      - name: Run security scan on changes
        if: steps.check-deps.outputs.dependency-changed == 'true'
        run: dotnet list package --vulnerable
```

### Advanced: Conditional workflow steps

```yaml
name: CI Pipeline

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Check for dependency changes
        id: deps
        uses: your-org/check-package-dependency-changes@v1
        with:
          packages-file-name: 'package-lock.json'
          project-root-directory: '.'
          check-git: true

      - name: Install dependencies
        run: npm ci

      - name: Run security audit (only on dependency changes)
        if: steps.deps.outputs.dependency-changed == 'true'
        run: npm audit

      - name: Run dependency vulnerability scan (only on dependency changes)
        if: steps.deps.outputs.dependency-changed == 'true'
        run: npm run scan-dependencies

      - name: Build
        run: npm run build

      - name: Test
        run: npm test
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `packages-file-name` | File name of package file (e.g., `package-lock.json`, `project.assets.json`) | Yes | - |
| `project-root-directory` | File path to root of the project source code where package files are located | Yes | - |
| `output-file-name` | Name of JSON file to output with file hashes | No | `previous.json` |
| `check-git` | Check git for changes to package files in the repository | No | `false` |
| `check-directory-files` | Check directory files for changes by comparing file hashes | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `dependency-changed` | Whether dependencies have changed (`true` or `false`) |
| `hash-record-path` | Path to the file containing hash records (only when `check-directory-files` is `true`) |

## How It Works

### Git Mode (`check-git: true`)

1. Lists all files tracked by git in the repository
2. Checks if the specified package file is tracked
3. Compares the current commit with the previous commit
4. Sets `dependency-changed` to `true` if the package file was modified

### Directory Files Mode (`check-directory-files: true`)

1. Recursively searches for all files matching the specified package file name
2. Generates SHA-1 hashes for each found file
3. Compares hashes with previously stored hashes (from `output-file-name`)
4. Stores new hashes as an artifact for future comparisons
5. Sets `dependency-changed` to `true` if any hash differs

## Environment Variables

The action also exports an environment variable `DEPENDENCY_CHANGED` that can be used in subsequent steps:

```yaml
- name: Check dependencies
  uses: your-org/check-package-dependency-changes@v1
  with:
    packages-file-name: 'package-lock.json'
    project-root-directory: '.'
    check-git: true

- name: Use environment variable
  run: |
    if [ "$DEPENDENCY_CHANGED" = "true" ]; then
      echo "Dependencies have changed!"
    fi
```

## Use Cases

- **Conditional security scans**: Only run security scans when dependencies change
- **Optimized CI/CD**: Skip dependency-related tasks when dependencies haven't changed
- **Multi-project monorepos**: Check specific package files in different directories
- **.NET projects**: Monitor `project.assets.json` for dependency changes
- **Node.js projects**: Track `package-lock.json` or `package.json` changes

## Development

### Prerequisites

- Node.js 20.x or higher
- npm

### Setup

```bash
# Install dependencies
npm install

# Build the action
npm run build

# Run tests
npm test
```

### Building

The action must be built before it can be used. The built files are placed in the `dist/` directory:

```bash
npm run build
```

### Publishing to GitHub Marketplace

To publish this action to the GitHub Marketplace:

1. Ensure the action is built and the `dist/` folder is committed
2. Create a new release with a semantic version tag (e.g., `v1.0.0`)
3. In the release creation form, check "Publish this Action to the GitHub Marketplace"
4. Fill in the required marketplace information
5. Publish the release

The action will then be available in the GitHub Marketplace.

**Important**: Always commit the `dist/` folder before creating a release. GitHub Actions run the compiled code from `dist/index.js`, not the TypeScript source.

```bash
# Build and commit before releasing
npm run build
git add dist/
git commit -m "Build for release"
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

## License

ISC - See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Build and test (`npm run build && npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Support

For issues and questions, please open an issue in the GitHub repository.