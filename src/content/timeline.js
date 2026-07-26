/**
 * Career timeline displayed as git log commits.
 * Each entry: { hash, date, message, tag?, body? }
 * body: optional — shown on click as an expandable detail block.
 */
const timelineData = [
  {
    hash: "0f1a2b3",
    date: "Aug 2026",
    message: "chore: still shipping. semicolon still missing.",
    tag: "HEAD -> main",
    body: [
      "MLE2 @ Comcast",
      "building ML systems, occasionally breaking them",
      "semicolon still unaccounted for",
    ],
  },
  {
    hash: "f2a0c81",
    date: "Apr 2026",
    message: "feat(career): promoted to MLE2 at Comcast",
    tag: "tag: career/mle2",
    body: [
      "consistent shipping pays off apparently",
      "still figuring out what senior actually means",
    ],
  },
{
    hash: "4f8e21b",
    date: "May 2024",
    message: "feat(career): graduated from SSN",
    tag: "tag: v4.0.0",
    body: [
      "B.E. Computer Science — SSNCE, Kalavakkam",
      "four years, one degree, many 3am debug sessions",
    ],
  },
  {
    hash: "9c3d77e",
    date: "Jan 2024",
    message: "feat(career): joined Comcast as MLE1",
    body: [
      "first real job, first real deadlines",
      "learned what 'it works in prod' means the hard way",
    ],
  },
  {
    hash: "a1b2c3d",
    date: "Nov 2020",
    message: "chore: initial empty commit",
    body: [
      "enrolled in B.E. CSE — SSNCE, Kalavakkam",
      "this is where it all begins...",
    ],
  },
];

Object.freeze(timelineData);

export default timelineData;
