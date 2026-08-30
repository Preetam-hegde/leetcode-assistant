# LeetSensei — LeetCode AI Assistant

Chrome Manifest V3 extension that adds AI explanations, hints, solutions, and code reviews to LeetCode problem pages.

## Privacy and API keys

The extension does not include a developer API key or a telemetry service. You enter your own OpenRouter or Google AI Studio key. Problem text, code, prompts, and generated requests are sent directly from the browser to the provider selected in Settings. See [PRIVACY.md](PRIVACY.md).

## Load locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository folder.
5. Open a LeetCode problem and the extension popup or side panel.

## Release checklist

- Test with a throwaway API key and remove it before packaging.
- Confirm every manifest path exists.
- Zip the repository contents without `.git`, `.DS_Store`, or secrets.
- Upload the ZIP in the Chrome Web Store Developer Dashboard.

