# LeetSensei Global Learning Workspace

## Goal

Make the existing Chrome extension useful to a broad international audience by turning the side panel into a guided learning workspace instead of a provider-focused action grid.

## Scope

- Redesign the side panel markup and styling.
- Replace six equal action cards with five ordered learning actions: Understand, Hint, Try, Review, and Solution.
- Keep the active problem, difficulty, and topics visible as the workspace context.
- Add lightweight controls for explanation language, code language, and learner level.
- Keep API/provider/model configuration in the existing popup and settings flow.
- Preserve the existing AI request and storage behavior wherever possible.

## Out of scope

- Backend services, accounts, telemetry, subscriptions, or persistent cross-device history.
- Rewriting the prompt system or changing provider integrations.
- Full localization of the extension UI; the new language control only supplies context for AI responses.

## UI direction

The side panel will use a calm dark surface with one orange accent, stronger typography hierarchy, generous spacing, and fewer boxed regions. The first viewport will orient the user around the current problem and one clear next action. The response area remains the primary work surface, with the chat input retained as a secondary escape hatch.

## Behavior

- Existing actions remain available through the new learning steps by mapping them to the closest current prompt.
- “Try” uses the existing code-review behavior when code is available and otherwise explains how to start.
- Language, code language, and level are stored locally and appended to generated prompts without changing provider behavior.
- Missing API configuration continues to show the existing settings path.

## Verification

- Confirm all referenced manifest files still exist.
- Run the repository’s available tests or lightweight syntax checks.
- Manually inspect the side panel at narrow and wide widths for overflow, focus visibility, and readable contrast.
