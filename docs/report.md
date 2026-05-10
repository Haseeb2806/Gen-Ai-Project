# Final Project Report

> **Template instructions:** This is your team's reflection on the 3-week project. It is graded on **specificity**. Generic statements like "the agent was sometimes wrong" earn few points. Concrete examples with context earn full points.
>
> Write this jointly with your partner. Keep running notes throughout the project so you have concrete examples to draw from.
>
> **Delete this instruction block when the report is complete.**

---

## Team

- **Member 1:** [Name]
- **Member 2:** [Name]
- **Member 3 (if applicable):** [Name]
- **Assigned Dataset:** [Dataset name and number]
- **Coding Agent Used:** [Antigravity / Claude Code / Codex / Cursor]
- **LLM Used in the App:** [Gemini / Claude / OpenAI / Groq]

---

## 1. What the Agent Did Well

[TODO — Be specific. Pick 3-5 genuine examples of agent outputs that impressed you. For each, briefly describe:

- What the agent was asked to do
- What the agent produced
- Why that output was good

Example of a good entry:
"When we asked the agent to write the tool-use handler for the LLM chat, it automatically recognized that our query functions needed explicit schemas for the LLM to use them correctly. It generated Pydantic schemas, wrote the tool registration code, and included type hints throughout — none of which we had explicitly requested. This saved us at least half a day of trial-and-error."

Example of a bad entry (avoid):
"The agent wrote good code."
]

---

## 2. Where We Had to Intervene

[TODO — Be specific. Describe at least 3 moments where you recognized the agent was about to do something wrong or suboptimal, and you redirected it. For each:

- What the agent was about to do
- Why it was wrong
- How you redirected it
- What you learned from catching it

Example of a good entry:
"On Day 10, the agent proposed adding a 'quick fix' to handle our Airbnb dataset's outlier prices by hardcoding a cap at $2000. We pushed back because:
1. Our app must work with any CSV, not just Airbnb
2. Hardcoded domain-specific logic defeats the generic requirement
We redirected the agent to instead add a configurable outlier filter the user could adjust. This led to ADR-003 about outlier handling. The lesson: the agent will happily solve the specific problem in front of it without thinking about generality. We had to keep reminding it of the spec's 'generic CSV' requirement."

The anti-rationalization moments are particularly valuable. Times when the agent said things like:
- "This is simple enough to skip the spec"
- "I'll add tests later"
- "This edge case is unlikely"
- "The user probably won't do that"

...and you had to push back.
]

---

## 3. Which Skills Activated When

[TODO — The six mandatory skills are automatically loaded by the agent. Describe how you saw them affect the agent's behavior.

For each skill, give a concrete example of it working:

### spec-driven-development
[Example: "When we asked 'let's build the upload feature,' the agent produced a spec section first, surfacing assumptions like 'do we support Excel files too?' before writing any code."]

### planning-and-task-breakdown
[Example]

### incremental-implementation
[Example]

### test-driven-development
[Example]

### documentation-and-adrs
[Example]

### git-workflow-and-versioning
[Example]

]

---

## 4. What We Would Do Differently

[TODO — If you had another week, what would change? Be specific.]

- [What you'd refactor]
- [What you'd add]
- [What technical debt you'd pay down]
- [What skill you'd invoke more deliberately]

---

## 5. Key Lessons for Future Projects

[TODO — What did you learn that you'll carry forward to your next AI-assisted project? These are the lessons this course is trying to teach. Framing them in your own words is part of the learning.

Examples of lessons worth articulating:
- "Spec first pays off by Day 5"
- "Anti-rationalizations are easy to miss unless you're actively looking for them"
- "Small commits are easier for both you and the agent to reason about"
- "The agent is a collaborator, not an oracle"
]

---

## 6. Time Spent (approximate)

| Activity | Hours |
|----------|-------|
| Reading docs, setting up | [X] |
| Spec writing | [X] |
| Planning and task breakdown | [X] |
| Implementation | [X] |
| Debugging | [X] |
| Documentation and ADRs | [X] |
| This report | [X] |
| **Total per person** | [X] |

---

## 7. Acknowledgments

We used the Agent Skills framework developed by Addy Osmani (https://github.com/addyosmani/agent-skills, MIT License). The six mandatory skills in `.agent/skills/` are unmodified copies of his SKILL.md files.

[TODO — Any other acknowledgments: helpful classmates, office hours, external resources.]

---

*Report version: 1.0 | Last updated: [date]*
