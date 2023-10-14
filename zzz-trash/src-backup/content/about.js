export default [
  {
    input: "Shivcharan.contactInfo",
    return: [
      {
        text: "Email",
        href: "mailto:shivanavukkarasu@example.com",
      },
      {
        text: "LinkedIn",
        href: "https://www.linkedin.com/in/shivcharan",
        rel: "noopener",
        target: "_blank",
      },
      {
        text: "Github",
        href: "https://github.com/shivcharan",
        rel: "noopener",
        target: "_blank",
      },
    ],
  },
  {
    input: "Shivcharan.resume",
    return: [
      {
        text: "shivcharan_resume.pdf",
        href: "/shivcharan_resume.pdf",
        target: "_blank",
        rel: "noopener",
      },
    ],
  },
  {
    input: "Shivcharan.interests",
    return: '["cricket", "songs", "coding", "tech"]',
  },
  {
    input: "Shivcharan.education",
    return: '"B.E. Computer Science - SSNCE, Kalavakkam"',
  },
  {
    input: "Shivcharan.skills",
    return:
      '["C/C++", "Python", "JavaScript", "React", "Redux", "Flask", "webpack", "git"]',
  },
];
