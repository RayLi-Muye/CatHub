# GitHub Workflow

CatHub maintenance uses a GitHub-native development flow for non-trivial work:

1. Create or link a GitHub Issue.
2. Implement on a topic branch.
3. Open a Pull Request linked to the issue.
4. Let GitHub Actions run as the quality gate.
5. Review the PR and make an explicit merge decision.

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
- List owner decisions needed before merge, deploy, release, production data
  operations, or sensitive credential use

GitHub Actions failures should be triaged and fixed before expanding scope.

## Owner Authorization Boundaries

The following actions require separate explicit owner approval:

- Merge
- Release
- Deploy
- Production data operations
- Reading or using sensitive credentials
- Store submission or store metadata changes
