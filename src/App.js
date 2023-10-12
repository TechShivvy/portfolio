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
import Construction from "./components/Construction";

function App() {
  useEffect(() => {
    document.addEventListener("DOMContentLoaded", function (event) {
      var scrollpos = sessionStorage.getItem("scrollpos");
      if (scrollpos) {
        window.scrollTo(0, scrollpos);
        sessionStorage.removeItem("scrollpos");
      }
    });

    window.addEventListener("beforeunload", function (e) {
      sessionStorage.setItem("scrollpos", window.scrollY);
    });
  }, []);

  return (
    <>
      <Home />
      <Navbar />
      <Progressbar />
      <About data={aboutData} />
      {/* <Project data={projectData} /> */}
      <Construction/>
      <Footer />
    </>
  );
}

export default App;
