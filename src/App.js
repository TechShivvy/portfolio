import "./App.css";
import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import aboutData from "./content/about";
import projectData from "./content/projects";

const About = lazy(() => import("./components/About"));
const Construction = lazy(() => import("./components/Construction"));
const Error404 = lazy(() => import("./components/Error404"));
const Footer = lazy(() => import("./components/Footer"));
const Home = lazy(() => import("./components/Home"));
const Navbar = lazy(() => import("./components/Navbar"));
const Progressbar = lazy(() => import("./components/Progressbar"));
const Project = lazy(() => import("./components/Project"));

// import About from "./components/About";
// import Footer from "./components/Footer";
// import Home from "./components/Home";
// import Navbar from "./components/Navbar";
// import Progressbar from "./components/Progressbar";
// import Project from "./components/Project";
// import "./components/_Matrix.css";
// import React, { useEffect, useRef, useState } from "react";
// import aboutData from "./content/about";
// import projectData from "./content/projects";
// import Construction from "./components/Construction";

function App() {
  const [isTabActive, setIsTabActive] = useState(true);
  const activeTitle = "Shivi";
  const inactiveTitle = "Shh...secret tab";

  const updateTitle = () => {
    document.title = isTabActive ? activeTitle : inactiveTitle;
  };

  useEffect(() => {
    // console.log(aboutData.aboutData)
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

  useEffect(() => {
    document.addEventListener("visibilitychange", () => {
      setIsTabActive(!document.hidden);
    });

    updateTitle();

    return () => {
      document.removeEventListener("visibilitychange", () => {
        setIsTabActive(!document.hidden);
      });
    };
  }, [isTabActive]);

  return (
    <Router>
      <Suspense fallback={<div></div>}>
        {/* <Home />
      <Navbar />
      <Progressbar />
      <About data={aboutData} />
      <Project data={projectData} />
      <Construction />
      <Footer /> */}

        <Suspense fallback={<div></div>}>
          <Routes>
            <Route
              exact
              path="/"
              element={
                <>
                  <Home />
                  <Navbar />
                  <Progressbar />
                  <About data={aboutData} />
                  <Project data={projectData} />
                  <Construction />
                  <Footer />
                </>
              }
            />
            <Route path="*" element={<Error404 />} />
          </Routes>
        </Suspense>
      </Suspense>
    </Router>
  );
}

export default App;
