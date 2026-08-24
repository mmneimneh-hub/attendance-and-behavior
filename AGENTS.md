# Attendance system agent instructions

## Install and validation

- Codex Cloud installs dependencies in the environment setup phase with `npm ci`.
- During the agent phase, do not run `npm ci`, `npm install`, or another dependency download when `node_modules` is already present.
- Validate code changes with `npm run build`.
- If dependencies are missing in Codex Cloud, report that the environment setup must be rerun instead of retrying a network download from the restricted agent phase.

## Deployment

- Do not install or invoke the Vercel CLI from Codex Cloud (`npx vercel`, `vercel --prod`, or similar).
- Vercel Git integration is the deployment mechanism for this repository.
- Pushes to non-production branches create preview deployments. Merges or pushes to `main` create production deployments.
- A successful local build validates the source; confirm the resulting Git deployment through Vercel after the commit is pushed.

## GitHub and repository access

- Codex Cloud uses the repository connected to the selected cloud environment. Do not require `gh auth status` as a project validation check.
- Do not create, request, or store a personal GitHub token in this repository or in the cloud environment just to authenticate the GitHub CLI.
- If the `origin` remote is present, leave it unchanged. If it is absent, continue with local commits and use the Codex Cloud **Open PR** workflow to publish the changes.
- Direct `git push` is optional and should only be attempted when the current environment already provides both a remote and working authentication.
