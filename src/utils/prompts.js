/**
 * Refined, High-Signal Prompts for LeetSensei
 * Rule: Maximum technical signal, minimal word count. No fluff or repetitive text.
 */

export const SYSTEM_PROMPT = `You are LeetSensei, a high-efficiency AI DSA mentor.
RULES FOR RESPONDING:
1. BE CONCISE AND PUNCHY. Never write walls of text.
2. Use bullet points, bold key terms, short sentences, and clean math notation like O(N).
3. Cut out greetings, filler sentences, and verbose intros. Get straight to the answer.`;

/**
 * 1. Simplify & Reframe Problem Statement (Short & Crisp)
 */
export function buildReframeDescriptionPrompt(problem) {
  return `Reframe this LeetCode problem into a crystal-clear, 30-second summary.

Problem: ${problem.title || 'Unknown'} (${problem.difficulty || ''})
Description: ${problem.description || ''}

FORMAT REQUIREMENTS (Keep under 150 words total):
- 🎯 **What it actually asks**: 2 short sentences explaining the goal in plain English.
- 📥 **Input → Output**: 1 line simple example.
- ⚡ **Key Constraint & Target Complexity**: State constraint and required Big-O (e.g., N <= 10^5 -> O(N) or O(N log N)).
- ⚠️ **Main Trap / Edge Case**: 1-2 bullet points on subtle traps.`;
}

/**
 * 2. Best Python 3 Solution (Code + Brief Complexity)
 */
export function buildBestPythonSolutionPrompt(problem) {
  return `Provide the single most optimal Python 3 solution for this LeetCode problem.

Problem: ${problem.title || 'Unknown'}
Description: ${problem.description || ''}

FORMAT REQUIREMENTS:
1. **Python 3 Code**: Clean, idiomatic Python 3 solution with type hints.
2. **Complexity Analysis** (Keep under 3 lines):
   - **Time**: $O(\dots)$ — brief 1-line reason.
   - **Space**: $O(\dots)$ — brief 1-line reason.
3. **Why Optimal**: 2 short bullet points on why this approach is best.`;
}

/**
 * 3. Best Algorithmic Method & Pattern Selector
 */
export function buildBestMethodSelectorPrompt(problem) {
  return `Which DSA pattern & method should be used for this problem and why?

Problem: ${problem.title || 'Unknown'} (${problem.difficulty || ''})
Description: ${problem.description || ''}

FORMAT REQUIREMENTS:
- 💡 **Optimal Pattern**: [e.g. Monotonic Stack / Two Pointers / Sliding Window / DP]
- 🧠 **How to Deduce It**: 3 quick bullet points explaining the signal in the problem that points to this pattern.
- ⚖️ **Method Comparison**:
  - **Naive**: Approach & Complexity
  - **Optimal**: Approach & Complexity
- 🎯 **Golden Rule**: 1 sentence rule of thumb for this pattern in interviews.`;
}

/**
 * 4. 3-Stage Progressive Hints (Short & Incremental)
 */
export function buildProgressiveHintsPrompt(problem) {
  return `Provide 3 progressive hints for this problem. Each hint MUST be 1-2 short sentences max.

Problem: ${problem.title || 'Unknown'}
Description: ${problem.description || ''}

FORMAT REQUIREMENTS:
- 🔹 **Hint 1 (Intuition)**: High-level mental model push (no algorithm names).
- 🔸 **Hint 2 (Pattern & Data Structure)**: Specify the exact pattern/data structure to consider.
- 🔺 **Hint 3 (Key Trick / Edge Case)**: The specific trick or edge case needed to pass test cases.`;
}

/**
 * 5. Step-by-Step Explanation & Dry Run (Crisp)
 */
export function buildStepExplanationPrompt(problem) {
  return `Explain the algorithm logic concisely.

Problem: ${problem.title || 'Unknown'}
Description: ${problem.description || ''}

FORMAT REQUIREMENTS:
1. 🛠️ **Algorithm Steps**: 3-4 numbered, bulleted steps.
2. 🔍 **Quick Dry Run**: Tracing 1 test case in 3-4 short lines.
3. 🛑 **Common Mistake**: 1-2 bullet points on frequent candidate errors.`;
}

/**
 * 6. Review & Debug User Code
 */
export function buildCodeReviewPrompt(problem, userCode) {
  return `Review the user's current code attempt.

Problem: ${problem.title || 'Unknown'}
User Code:
\`\`\`python
${userCode || '# No code provided'}
\`\`\`

FORMAT REQUIREMENTS:
- 🚦 **Verdict**: [Correct / Buggy / Suboptimal]
- 🐛 **Issues Found**: 2-3 bullet points on specific bugs or edge cases missed.
- ⏱️ **Complexity**: Current Time & Space complexity.
- 🛠️ **Refactored Code**: Clean, fixed Python 3 snippet.`;
}

/**
 * 7. Custom User Question
 */
export function buildCustomChatPrompt(problem, userQuery) {
  return `Problem Context: ${problem.title || 'General'} (${problem.difficulty || ''})\nUser Question: ${userQuery}\n\nAnswer concisely in under 100 words using bullet points where appropriate.`;
}
