document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM fully loaded and parsed");

  // Get a reference to the navbar element
  const navbar = document.getElementById("navbar");
  const progressContainer = document.getElementById("progress-container");

  // Function to show the navbar when scrolling down
  function showNavbar() {
    if (window.scrollY > window.innerHeight) {
      // navbar.style.display = "block";
      $("#navbar").slideDown(250);
      $("#progress-container").slideDown(250);
      // $("#progress-container").show("slide", { direction: "left" }, 1000);
      // progressContainer.style.display = "block";
      // $("#navbar").slideDown(250, function () {
      //   // Callback function after the navbar has finished sliding down
      //   // Show the progress container
      //   $("#progress-container").slideDown(250);
      // });
    } else {
      // navbar.style.display = "none";
      $("#navbar").slideUp(50);
      $("#progress-container").slideUp(50);
      // $("#progress-container").hide();
      // progressContainer.style.display = "none";
    }
  }

  // Add an event listener to the window's scroll event
  window.addEventListener("scroll", showNavbar);

  // Your data stored in a JavaScript file (data.js)

  // Function to format and append data to the fakeScreen div
  function formatAndAppendData(data) {
    const fakeScreen = document.getElementById("fakeScreen");

    data.forEach((item) => {
      // Create p elements for input and return values
      const inputP = document.createElement("p");
      const returnP = document.createElement("p");

      // Add ">" before input value
      inputP.textContent = `> ${item.input}`;

      // Add a line break between input and return
      // inputP.appendChild(document.createElement("br"));

      // Check if the return value is an array (contactInfo or resume)
      if (Array.isArray(item.return)) {
        // Handle the array of links
        const linkArray = item.return.map((link) => {
          return `"<a href="${link.href}"${
            link.target ? ` target="${link.target}"` : ""
          }${link.rel ? ` rel="${link.rel}"` : ""}>${link.text}</a>"`;
        });
        if (linkArray.length > 1) {
          returnP.innerHTML = `[${linkArray.join(", ")}]`; // Display as an array with multiple elements
        } else if (linkArray.length === 1) {
          returnP.innerHTML = linkArray[0]; // Display as a single element without array
        }
        // returnP.innerHTML = `[${linkArray.join(", ")}]`;
      } else {
        // Handle other return values (e.g., interests, education, skills)
        returnP.textContent = item.return;
      }

      // Append p elements to the fakeScreen div
      fakeScreen.appendChild(inputP);
      fakeScreen.appendChild(returnP);
      // fakeScreen.appendChild(document.createElement("br"));
    });

    const cursorP = document.createElement("p");
    const cursorSpan = document.createElement("span");
    cursorSpan.className = "cursor";
    cursorSpan.innerHTML = "&nbsp;";
    cursorP.appendChild(document.createTextNode("> "));
    cursorP.appendChild(cursorSpan);
    fakeScreen.appendChild(cursorP);
  }

  // Call the function to format and append data
  formatAndAppendData(data);
});

$(document).ready(function () {
  // Function to update the progress bar based on scroll position
  function updateProgressBar() {
    var scrollPercentage =
      ((document.documentElement.scrollTop || document.body.scrollTop) /
        (document.documentElement.scrollHeight -
          document.documentElement.clientHeight)) *
      100;
    $("#progress-bar").css("width", scrollPercentage + "%");
  }

  // Update the progress bar when the page loads
  updateProgressBar();

  // Update the progress bar when the page is scrolled
  $(window).scroll(function () {
    updateProgressBar();
  });
});
