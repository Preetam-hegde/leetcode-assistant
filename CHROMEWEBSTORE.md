# Chrome Web Store Metadata & Publishing Guide

**Extension Name**: LeetSensei - LeetCode AI Assistant  
**Version**: 1.0.0  
**Category**: Developer Tools / Productivity  
**Language**: English  
**Last Updated**: 2026-08-09  

---

## 1. Store Listing Copy

### Short Description (Max 132 characters)
AI LeetCode mentor. Get simplified problem statements, optimal Python 3 solutions, progressive hints, & algorithm pattern selector.

### Detailed Description
Master Data Structures and Algorithms with **LeetSensei** — your high-efficiency AI mentor built directly into LeetCode.

#### Key Features:
- 📝 **Simplify & Reframe Problem Statements**: Rewrites convoluted LeetCode problem descriptions into 30-second plain English summaries with simplified inputs/outputs, real-world analogies, and key constraint breakdowns.
- 🐍 **Optimal Python 3 Solutions**: Generates clean Python 3 solutions with type hints and concise Big-O Time & Space Complexity analysis.
- 🎯 **Algorithmic Method & Pattern Selector**: Teaches you how to deduce the right data structure and pattern (Monotonic Stack, Two Pointers, Dynamic Programming, etc.) based on problem constraints.
- 💡 **3-Stage Progressive Hints**: Short, punchy 1-2 sentence hints across 3 levels (Intuition $\rightarrow$ Pattern $\rightarrow$ Key Trick) so you don't spoil the solution.
- 📖 **Step-by-Step Logic & Dry Run**: Concise algorithm breakdown with variable tracing on example test cases.
- 🔍 **Review & Debug My Code**: Analyzes your code in the LeetCode editor, identifies bugs, off-by-one errors, edge cases, and provides refactored code.
- 🤖 **Powered by OpenRouter**: Choose from top AI reasoning models including **DeepSeek R1**, DeepSeek V3, Claude 3.5 Sonnet, Gemini 2.5 Flash, and Llama 3.3.

---

## 2. Permissions Justification

| Permission | Reason / Plain-English Justification |
| :--- | :--- |
| `storage` | Required to save your OpenRouter API key and model preference. |
| `activeTab` | Required to access the active LeetCode tab and parse problem info on click. |
| `scripting` | Required to interact with the LeetCode code editor. |
| `sidePanel` | Required to display the extension UI inside the Chrome Side Panel. |

### Host Permissions Justification
- `https://leetcode.com/*` & `https://*.leetcode.com/*`: Required to parse LeetCode problem details via GraphQL and show the floating trigger button.
- `https://openrouter.ai/*`: Required to send API requests to OpenRouter chat completion endpoints.
