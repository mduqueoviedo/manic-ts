# AGENTS

## Repository workflow
- Work in short-lived feature branches.
- Keep changes small and focused.
- Leave changes uncommitted unless the user explicitly asks for a commit.
- Do not push branches or open pull requests unless the user explicitly asks.
- When a pull request is requested, derive its title and description from the
  branch changes instead of relying on a static template.
- Treat a request to integrate a finished feature into `main` as authorization
  to commit it, publish its branch, open a pull request and merge it.
- Integrate finished features into `main` through a pull request rather than a
  direct local merge.
- Review recent closed pull requests before publishing so the title and
  description follow the repository's established style.
- Open feature pull requests ready for review, with sections that describe the
  summary, changes, motivation, current limitations and validation performed.
- Merge accepted feature pull requests with squash so `main` retains one
  descriptive commit that includes the pull request number.
- After merging, switch the local checkout to `main` and fast-forward it to
  `origin/main`.

## Project notes
- The project is a Vite + TypeScript + Canvas game prototype.
- Keep code, comments, and documentation in English.
- Prefer incremental changes that can be verified independently.
- When referencing original game behavior, use external sources only and do not add disassembly or third-party source code files to the repository.
