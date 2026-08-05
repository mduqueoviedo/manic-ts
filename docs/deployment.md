# Deployment workflow

The project uses Vercel's Git integration for deployments and GitHub checks for
repository-level quality gates. This document records the settings that live
outside the repository and keeps the remaining rollout explicit.

## Initial Vercel setup

The GitHub repository is imported into Vercel with these settings:

- Framework preset: Vite
- Root directory: repository root
- Install command: automatic package-manager detection
- Build command: `pnpm build`
- Output directory: `dist`
- Production branch: `main`

The Git integration creates a preview deployment for each pull request and a
production deployment for changes merged into `main`.

Vercel's Native Deployment Checks support the matching `lint` and `typecheck`
package scripts. The `Typecheck` check runs `pnpm typecheck` and is required for
both preview and production, so a type error prevents the deployment alias from
being assigned. The automated test suite remains in GitHub Actions because it
is not one of Vercel's native script checks.

## GitHub CI follow-up

Add a focused GitHub Actions workflow that runs for pull requests and pushes to
`main`, and verifies:

- `pnpm exec vitest run`
- `pnpm typecheck`
- `pnpm build`

The repository workflow is defined in `.github/workflows/ci.yml`. Its required
check is exposed as `Test and build`; keep that name stable in the `main`
ruleset and when selecting the Vercel Deployment Check. Running the workflow
again after a merge associates the result with the exact commit that Vercel
builds for production, including when the pull request is squash merged.

The `main` ruleset requires pull requests, squash merges, resolved review
threads and a successful `Test and build` result. This blocks a failing change
before it can be merged. Vercel also requires that GitHub Actions result as a
production Deployment Check, so the production alias waits for repository CI
as well as the native `Typecheck` check.

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
