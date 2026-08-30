# Security Rules

These rules override convenience. Never relax them unless the user explicitly changes the repository policy and the action remains safe.

## Never commit sensitive values

Do not write real values for:

- airport/provider subscription URLs
- usernames or passwords
- API tokens
- access tokens
- refresh tokens
- Cloudflare API tokens
- private keys
- secret keys
- cookies or session secrets
- authorization headers
- UUIDs used as private node credentials
- client secrets
- webhook secrets
- personally identifying fixed codes that the user intends to keep private

Use placeholders such as:

- `YOUR_SUBSCRIPTION_URL`
- `YOUR_UUID`
- `YOUR_TOKEN`
- `YOUR_SECRET`

Follow the repository's existing placeholder convention when one already exists.

## Git history awareness

Removing a secret from the current file does not erase it from Git history.

If a secret appears to have been committed previously:

1. Do not repeat it in the response.
2. Identify the file and type of secret without exposing the full value.
3. Recommend rotating/revoking the credential first.
4. Treat history cleanup as a separate operation requiring deliberate user intent.

## Third-party code

For Worker scripts, rewrite scripts, modules, or code imported from another repository:

- Inspect the exact current source before trusting it.
- Look for telemetry, credential exfiltration, unexpected fetch destinations, dynamic code loading, obfuscation, crypto-mining behavior, hidden redirects, or unrelated network calls.
- Prefer small, readable, self-hosted code when practical.
- Do not claim code is safe merely because it is popular or open source.

## MITM minimization

For Shadowrocket MITM:

- Add only hostnames that are demonstrably required.
- Never use a broad wildcard when a small explicit hostname list is sufficient.
- Do not add sensitive banking, password manager, authentication, or unrelated domains to MITM without a clear need.

## Pre-write secret review

Before committing, inspect the diff for suspicious patterns such as:

- `token=` / `token:`
- `password=` / `password:`
- `secret=` / `secret:`
- `Authorization:`
- private-key blocks
- long opaque query parameters
- provider/subscription URLs containing credential-like path components
- real UUID values where the repository policy expects placeholders

False positives are acceptable during review; accidental credential publication is not.
