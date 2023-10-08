// script.js
const finaltext = "Shivcharan";
const characters =
  "!#$%&'()*+,-./:;<=>?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const iterations = finaltext.length + 20;

function randomstr() {
  const n = Math.floor(Math.random() * characters.length);
  return characters[n];
}

const text = [];

for (let i = 0; i < finaltext.length; i++) {
  const t = [];
  text.push(t);
}
console.log(text);
for (let i = 0; i < finaltext.length; i++) {
  const t = text[i];
  for (let j = 0; j < iterations - 20 * Math.random(); j++) {
    t.push(randomstr());
  }
  t.push(finaltext[i]);
}
console.log(text);

const elemout = document.getElementById("output");
const outputlist = [];

for (let i = 0; i < finaltext.length; i++) {
  const outputpart = document.createElement("div");
  outputpart.classList.add("letters");
  elemout.appendChild(outputpart);
  outputlist.push(outputpart);
}
console.log(outputlist);

let counter = 0;
console.log(counter)
function change() {
  let allCharactersRevealed = true; // Add a flag to track if all characters are revealed
  for (let i = 0; i < finaltext.length; i++) {
    const ft = text[i];
    if (counter < ft.length) {
      outputlist[i].innerHTML = ft[counter];
      allCharactersRevealed = false; // If any character is not yet revealed, set the flag to false

    } 
    // else {
    //   outputlist[i].innerHTML = ft[ft.length - 1];
    // }
  }
  counter++;
  if (allCharactersRevealed) {
    clearInterval(inst); // Stop the interval when all characters are revealed
  }
  console.log("hi");
}

const inst = setInterval(change, 100);
