import React from "react";
import styles from "../components/_Project.module.css";
// import projectsData from "./../content/projects";

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

export default ProjectCard;
