import React from "react";
import styles from "./_Project.module.css";
import ProjectCard from "../utils/project";

function Project(props) {
  const { data } = props;

  return (
    <div className={styles["project-section"]} id="projects">
      <div className={styles.container}>
        <h2 className={styles.heading}>Projects</h2>
        <p className={styles.para}>A glimpse into my completed projects:</p>
        <div
          className={`row ${styles["project-container"]}`}
          id="project-container"
        >
          {data.map((project, index) => (
            <ProjectCard key={index} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Project;
