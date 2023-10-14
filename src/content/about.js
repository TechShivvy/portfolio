const ABOUT = [
  {
    input: "Shivcharan.contactInfo",
    return: [
      {
        text: "Email",
        href: "mailto:shivcharan.thiru@gmail.com",
      },
      {
        text: "LinkedIn",
        href: "https://www.linkedin.com/in/shivcharan-thirunavukkarasu-09063723a",
        rel: "noopener",
        target: "_blank",
      },
      {
        text: "Github",
        href: "https://github.com/TechShivvy",
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
        href: "https://drive.google.com/file/d/1Xfr_fC38tmBgT5QwKVc3pCmQjnxekW4A/view?usp=sharing",
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
    return: '["C/C++", "Python", "JavaScript", "React", "Flask", "SQL"]',
  },
];

Object.freeze(ABOUT);

export default ABOUT;
