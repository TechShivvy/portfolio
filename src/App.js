import "./App.css";
import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import aboutData from "./content/about";
import projectData from "./content/projects";

const About = lazy(() => import("./components/About"));
const Construction = lazy(() => import("./components/Construction"));
const ContactForm = lazy(() => import("./components/Contact"));
const Error404 = lazy(() => import("./components/Error404"));
const Footer = lazy(() => import("./components/Footer"));
const Home = lazy(() => import("./components/Home"));
const Navbar = lazy(() => import("./components/Navbar"));
const Progressbar = lazy(() => import("./components/Progressbar"));
const Project = lazy(() => import("./components/Project"));
const ScrollUp = lazy(() => import("./components/ScrollUp"));

function App() {
  const [isTabActive, setIsTabActive] = useState(true);
  const activeTitle = "Shivi";
  const inactiveTitle = "Shh...secret tab";

  const updateTitle = () => {
    document.title = isTabActive ? activeTitle : inactiveTitle;
  };

  useEffect(() => {
    document.addEventListener("DOMContentLoaded", function (event) {
      var scrollpos = sessionStorage.getItem("scrollpos");
      console.log("Stored Scroll Position:", scrollpos);

      if (scrollpos) {
        console.log("Restoring scroll position:", scrollpos);
        window.scrollTo(0, scrollpos);
        sessionStorage.removeItem("scrollpos");
      }
    });

    const handleBeforeUnload = () => {
      const scrollY = window.scrollY;
      console.log("Saving scroll position:", scrollY);
      sessionStorage.setItem("scrollpos", scrollY.toString());
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
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
        <Suspense fallback={<div></div>}>
          <Routes>
            <Route
              exact
              path="/portfolio"
              element={
                <>
                  <Home />
                  <Navbar />
                  <Progressbar />
                  <About data={aboutData} />
                  <Project data={projectData} />
                  {/* <Construction /> */}
                  <ContactForm />
                  <Footer />
                  <ScrollUp />
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
