import React from "react";

function Navbar() {
  return (
    <nav className="navbar" id="navbar">
      <ul>
        <li>
          <a href="#home">&nbsphome&nbsp</a>
        </li>
        <li>
          <a href="#about">&nbspabout&nbsp</a>
        </li>
        <li>
          <a href="#project">&nbspprojects&nbsp</a>
        </li>
        <li>
          <a href="#contact">&nbspcontact&nbsp</a>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
