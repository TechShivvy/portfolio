import React from "react";
import styles from "./_Project.module.css";
import ProjectCard from "../utils/project";
import useFadeIn from "../utils/useFadeIn";
import projectData from "../content/projects";

function Project() {
  const fadeRef = useFadeIn();

  return (
    <div className={styles["project-section"]} id="projects" ref={fadeRef}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Projects</h2>
        <p className={styles.para}>A glimpse into my completed projects:</p>
        <div
          className={`row ${styles["project-container"]}`}
          id="project-container"
        >
          {projectData.map((project, index) => (
            <ProjectCard key={index} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Project;
