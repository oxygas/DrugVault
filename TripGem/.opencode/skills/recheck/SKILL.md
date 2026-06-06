---
name: recheck
description: Re-check everything created for the current request, compare it against the original prompt, fix gaps, and report a confidence score.
---

You are performing a strict verification-and-repair pass for the current workspace.

User request to validate against:
$ARGUMENTS

Process:
1. Determine the intended result from:
   - the user's supplied recheck instructions in $ARGUMENTS
   - the current conversation context
   - the files currently present in the workspace
2. Identify all relevant files that were created or modified for the task.
3. Read and inspect the full implementation, not just filenames or summaries.
4. Compare the implementation against the requested behavior, constraints, edge cases, and likely expectations.
5. Check for:
   - missing features
   - incorrect behavior
   - unfinished placeholders / TODOs
   - syntax errors
   - broken imports / references
   - mismatch between prompt and implementation
   - obvious UI/UX issues if this is an app/site
   - test/lint failures where applicable
6. Run the most relevant non-destructive validation commands if available.
7. Make the necessary fixes directly in the codebase.
8. Re-read the changed files after edits and verify the result again.
9. Output exactly these sections:

## Recheck result
- What was checked.
- What was wrong.
- What was changed.
- What still may be unresolved.

## Confidence
Confidence score: NN%

## Basis for score
- Why the score is not higher.
- What evidence supports the score.

Scoring rules:
- 90-100%: implementation matches the request closely, files were re-read after fixes, and relevant validation passed.
- 70-89%: likely correct but validation was partial, or some ambiguity remains.
- 40-69%: major uncertainty, incomplete validation, or possible unresolved issues.
- 0-39%: substantial mismatch, missing files, or unable to validate key behavior.

Rules:
- Be critical, not reassuring.
- Do not claim certainty without evidence.
- If tests/lint are unavailable, say so explicitly.
- If the prompt is ambiguous, say exactly what is ambiguous.
- Prefer fixing issues over merely describing them.
- Re-open the edited files before giving the final confidence score.