# GitHub Workflow

CatHub maintenance uses a GitHub-native development flow for non-trivial work:

1. Create or link a GitHub Issue.
2. Implement on a topic branch.
3. Open a Pull Request linked to the issue.
4. Let GitHub Actions run as the quality gate.
5. Review the PR and apply the current merge authorization boundary.

Direct implementation on `main` is reserved for trivial local inspection or
explicitly authorized emergency work.

## Issue Requirements

Issues should describe:

- Problem and user/project impact
- Scope and out-of-scope work
- Acceptance criteria
- Documentation impact
- Tests, screenshots, runtime proof, or GitHub Actions expected for validation
- Risks, rollback, and owner decision needs

Do not include secrets, tokens, production data, private reviewer credentials,
or raw personal data in public issues.

## Pull Request Requirements

Pull Requests should:

- Link the issue they close or advance
- Describe the exact scope
- Include validation commands and, when relevant, screenshots or live proof
- Explain documentation impact
- Call out risks and rollback
- List owner decisions needed before non-routine merge, deploy, release,
  production data operations, or sensitive credential use

GitHub Actions failures should be triaged and fixed before expanding scope.

## Owner Authorization Boundaries

Routine maintenance standing authorization allows the CatHub project context
owner to create or update issues, branches, commits, pushes, pull requests, CI
fixes, draft/ready state, and low-risk green PR merges when the scope is
ordinary maintenance and the PR remains within its documented issue.

The following actions still require separate explicit owner approval:

- Release
- Deploy
- Formal tags or package publishing
- Production data operations
- Real production or cloud resource operations
- Reading or using sensitive credentials
- Store submission or store metadata changes
- Destructive git operations
- Major customer- or user-visible product direction changes
