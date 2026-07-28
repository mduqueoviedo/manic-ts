# Deployment workflow

The project is intended to use Vercel's Git integration for deployments and
GitHub checks for repository-level quality gates. This document records the
settings that live outside the repository and keeps the planned rollout
explicit.

## Initial Vercel setup

Import the GitHub repository from the Vercel dashboard with these settings:

- Framework preset: Vite
- Root directory: repository root
- Install command: automatic package-manager detection
- Build command: `pnpm build`
- Output directory: `dist`
- Production branch: `main`

The Git integration should create a preview deployment for each pull request
and a production deployment for changes merged into `main`.

Add a Native Deployment Check that runs the package `test` script. Mark it as
required for both preview and production so a failed test prevents the
deployment from being promoted. Keep this as a separate check from the build so
both results remain visible and can run independently.

## GitHub CI follow-up

Add a focused GitHub Actions workflow that runs for pull requests and verifies:

- `pnpm exec vitest run`
- `pnpm build`

Make its result a required status check for `main`. This blocks a failing change
before it can be merged, while the Vercel check protects the deployment itself.
If the same GitHub Actions result is later selected as a Vercel Deployment
Check, production promotion will also wait for repository CI.

## Rollout checks

The setup is complete when:

- a pull request receives a working preview URL;
- a failing test produces a failed, required check;
- a pull request with a failing required check cannot be merged into `main`;
- a successful merge creates a production deployment; and
- production is not promoted until its configured deployment checks pass.

Update this document if the production branch, build command, output directory
or required checks change in either service.

## References

- [Vercel Git deployments](https://vercel.com/docs/git)
- [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks)
- [GitHub required status checks](https://docs.github.com/en/pull-requests/reference/status-checks)
