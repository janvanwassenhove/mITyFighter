# Spec-Kit Extensions & Presets Reference

## Architecture

Spec Kit can be tailored through two complementary systems plus project-local overrides:

| Priority | Component | Location |
|---------:|-----------|----------|
| 1 (highest) | Project-Local Overrides | `.specify/templates/overrides/` |
| 2 | Presets | `.specify/presets/templates/` |
| 3 | Extensions | `.specify/extensions/templates/` |
| 4 (lowest) | Spec Kit Core | `.specify/templates/` |

**Templates** are resolved at **runtime** — walks the stack top-down, uses first match.  
**Commands** are applied at **install time** — written into agent directories on `add`.  
If multiple presets/extensions provide the same command, highest-priority wins; on removal, next-highest restored.

## When to Use Which

| Goal | Use |
|------|-----|
| Add a brand-new command or workflow | **Extension** |
| Customize format of specs, plans, or tasks | **Preset** |
| Integrate an external tool or service | **Extension** |
| Enforce organizational or regulatory standards | **Preset** |
| Ship reusable domain-specific templates | Either |

## Managing Extensions

```bash
# Search available extensions
specify extension search

# Install
specify extension add <extension-name>

# Remove
specify extension remove <extension-name>
```

## Managing Presets

```bash
# Search available presets
specify preset search

# Install
specify preset add <preset-name>

# Remove
specify preset remove <preset-name>
```

Multiple presets can be stacked with priority ordering.

## Extension Hook System

Extensions can hook into the SDD workflow via `.specify/extensions.yml`:

```yaml
hooks:
  before_specify:
    - extension: git
      command: speckit.git.create-branch
      description: Create feature branch
      enabled: true
      optional: false
  after_specify:
    - extension: my-extension
      command: speckit.my-ext.post-process
      enabled: true
      optional: true
  before_constitution:
    ...
  after_constitution:
    ...
```

**Hook types**:
- `before_*` / `after_*` for each core command
- `optional: true` — user chooses whether to run
- `optional: false` — runs automatically (mandatory)
- Hooks with `condition` field are deferred to HookExecutor

## Notable Community Extensions

### Process & Workflow

| Extension | Purpose |
|-----------|---------|
| **Brownfield Bootstrap** | Auto-discover architecture for existing codebases |
| **AIDE** | Structured 7-step workflow for greenfield projects |
| **Conduct** | Orchestrate phases via sub-agent delegation |
| **Fleet Orchestrator** | Full feature lifecycle with human-in-the-loop gates |
| **TinySpec** | Lightweight single-file workflow for small tasks |
| **Canon** | Canon-driven (baseline-driven) workflows |
| **Bugfix Workflow** | Structured bugfix: capture → trace → patch |

### Code Quality

| Extension | Purpose |
|-----------|---------|
| **Review** | Comprehensive code review with specialized agents |
| **Staff Review** | Staff-engineer-level review against spec |
| **Verify** | Post-implementation validation against spec |
| **Verify Tasks** | Detect phantom completions (tasks marked done but not implemented) |
| **Cleanup** | Post-implementation quality gate (scout rule) |
| **Fix Findings** | Automated analyze-fix-reanalyze loop |
| **Security Review** | AI-powered DevSecOps security audit |

### Documentation

| Extension | Purpose |
|-----------|---------|
| **Repository Index** | Generate index for existing repo |
| **Reconcile** | Fix implementation drift in feature artifacts |
| **Spec Sync** | Detect/resolve drift between specs and code |
| **Iterate** | Refine specs mid-implementation |
| **Spec Critique** | Dual-lens review (product strategy + engineering risk) |
| **DocGuard** | CDD enforcement with automated checks |

### Integration

| Extension | Purpose |
|-----------|---------|
| **GitHub Issues** | Generate spec artifacts from GitHub Issues |
| **Jira Integration** | Create Jira Epics/Stories from specs |
| **Azure DevOps** | Sync to Azure DevOps work items |
| **Confluence** | Summarize specs in Confluence docs |

### Visibility

| Extension | Purpose |
|-----------|---------|
| **Project Health Check** | Diagnose spec-kit project health |
| **Project Status** | Show SDD workflow progress |
| **Spec Diagram** | Auto-generate Mermaid diagrams of workflow |
| **What-if Analysis** | Preview impact of requirement changes |
| **Spec Scope** | Effort estimation and scope tracking |

## Notable Community Presets

| Preset | Purpose |
|--------|---------|
| **Canon Core** | Adapts workflow for canon-driven development |
| **Explicit Task Dependencies** | DAG-based dependency declarations |
| **Fiction Book Writing** | Adapts SDD for storytelling (21 templates, 26 commands) |
| **Multi-Repo Branching** | Coordinates branches across multiple repos |
| **Table of Contents Navigation** | Adds navigable TOC to spec artifacts |
| **VS Code Ask Questions** | Batched interactive questioning via vscode/askQuestions |

## Creating Custom Extensions

Extensions add new commands and templates. Structure:

```
my-extension/
├── extension.yml           # Extension metadata
├── commands/
│   └── my-command.md       # Command prompt files
└── templates/
    └── my-template.md      # Custom templates
```

See the [Extension Publishing Guide](https://github.com/github/spec-kit/blob/main/extensions/EXTENSION-PUBLISHING-GUIDE.md).

## Creating Custom Presets

Presets override templates and commands. Structure:

```
my-preset/
├── preset.yml              # Preset metadata
├── commands/
│   └── specify.md          # Override core specify command
└── templates/
    └── spec-template.md    # Override core spec template
```

See the [Presets Publishing Guide](https://github.com/github/spec-kit/blob/main/presets/PUBLISHING.md).
