import React from "react";
import styles from "./_Project.module.css";
import projectsData from "./../content/projects"; // Import your projects data

function ProjectCard({ project }) {
  const { title, description, skills, links } = project;
  console.log(project);

  return (
    <div className={styles["card"]}>
      <div className={styles["card-title"]}>{title}</div>
      <div className={styles["card-description"]}>{description}</div>
      <div className={styles["card-skills"]}>
        <span className={styles["card-skills-text"]}>Skills:</span>{" "}
        {skills.join(", ")}
      </div>
      <div className={styles["card-buttons"]}>
        {links.github && (
          <a
            href={links.github}
            className={styles["card-button"]}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        )}
        {links.preview && (
          <a
            href={links.preview}
            className={styles["card-button"]}
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview
          </a>
        )}
      </div>
    </div>
  );
}

function Project(props) {
  const { data } = props;
  return (
    <div className={styles["project-section"]} id="projects">
      <h2>Projects</h2>
      <p>Few projects that I have done</p>
      <div className={styles.container} id="container">
        {data.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </div>
    </div>
  );
}

export default Project;
