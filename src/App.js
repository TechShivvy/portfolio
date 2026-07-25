import "./App.css";
import React, { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import aboutData from "./content/about";
import projectData from "./content/projects";

const About = lazy(() => import("./components/About"));
const BeyondCode = lazy(() => import("./components/BeyondCode"));
const ContactForm = lazy(() => import("./components/Contact"));
const Error404 = lazy(() => import("./components/Error404"));
const Footer = lazy(() => import("./components/Footer"));
const Home = lazy(() => import("./components/Home"));
const Navbar = lazy(() => import("./components/Navbar"));
const Progressbar = lazy(() => import("./components/Progressbar"));
const Project = lazy(() => import("./components/Project"));
const ScrollUp = lazy(() => import("./components/ScrollUp"));

function App() {
  useEffect(() => {
    document.title = "Shivi";
  }, []);

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

  return (
    <Router>
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
                  <BeyondCode />
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
    </Router>
  );
}

export default App;
