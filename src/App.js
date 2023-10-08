import "./App.css";
import About from "./components/About";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import Progressbar from "./components/Progressbar";
import Project from "./components/Project";
import MatrixRainEffect from "./components/Matrix";
import "./components/_Matrix.css";
import React, { useEffect, useRef } from "react";
import aboutData from "./content/about";
import projectData from "./content/projects";

function App() {
  return (
    <>
      <Home />
      <Navbar />
      <Progressbar />
      <About data={aboutData} />
      <Project data={projectData} />
      <Footer />
    </>
  );
}

export default App;
