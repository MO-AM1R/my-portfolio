// Global Elements
const sections = document.getElementsByClassName("section");
const navLinks = document.getElementsByClassName("navLink");

var sectionEnimations = [
  { enter: "", exit: "" },
  { enter: "sectionEnter", exit: "sectionExit" },
  { enter: "upToBottom", exit: "bottomToUp" },
  { enter: "upToBottom", exit: "bottomToUp" },
  { enter: "sectionEnter", exit: "sectionExit" },
  { enter: "sectionEnter", exit: "sectionExit" },
  { enter: "upToBottom", exit: "bottomToUp" },
];

async function showAccounts() {
  const accounts = document.getElementById("Accounts");
  const aboutme = document.getElementsByClassName("myinks")[0];
  accounts.style.opacity = "1";
  aboutme.style.opacity = "1";
}

function changePosition(mouse, element) {
  const imageContainer = element.parentNode;
  const image = element;

  const { clientX, clientY } = mouse;
  const containerRect = imageContainer.getBoundingClientRect();

  const offsetX = clientX - containerRect.left;
  const offsetY = clientY - containerRect.top;

  const centerX = containerRect.width / 2;
  const centerY = containerRect.height / 2;

  const moveX = (centerX - offsetX) / 5;
  const moveY = (centerY - offsetY) / 5;

  image.style.transform = `translate(${moveX}px, ${moveY}px)`;
}

function resetPosition(element) {
  element.style.transform = `translate(0px, 0px)`;
}

async function fetchData(type = "skills") {
  let response = await fetch("../JSON/skills.json");
  const data = await response.json();
  return data;
}

function fillSkillsContainer(skills) {
  let skillsContainer = document.getElementsByClassName("skillsContainer")[0];
  let skillHTML = "";
  skills.forEach((skill) => {
    skillHTML += `
        <div class="skill">
              <div class="info">
                <img src=${skill.icon} alt="skill" />
                <span>${skill.name}</span>
              </div>
            </div>`;
  });
  skillsContainer.innerHTML = skillHTML;
}

{
  document.addEventListener("DOMContentLoaded", async function () {
    new Typed("#multiple-text", {
      strings: [
        "Full-Stack Developer",
        "Flutter Developer",
        "student at Cairo University",
      ],
      typeSpeed: 60,
      backSpeed: 40,
      backDelay: 60,
      loop: true,
    });

    fetchData().then((data) => {
      fillSkillsContainer(data);
    });

    function isElementInViewport(element) {
      const rect = element.getBoundingClientRect();
      return (
        rect.top <= window.innerHeight / 2 &&
        rect.bottom >= window.innerHeight / 2
      );
    }
    // Nav Part
    {
      let sectionArray = Array.from(sections);
      let navArray = Array.from(navLinks);
      let footerNavBar = document.querySelectorAll(".menu li a");

      navArray.forEach((link) => {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          smoothScrollTo(this.getAttribute("href"));
          toggleNav();
        });
      });

      function smoothScrollTo(targetId) {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: "smooth" });
        }
      }

      //To Top
      const toTop = document.getElementById("to-top");
      toTop.addEventListener("click", function () {
        smoothScrollTo("#home");
      });

      //Footer nav bar
      footerNavBar.forEach((link) => {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          smoothScrollTo(this.getAttribute("href"));
        });
      });

      function updateActiveLink() {
        sectionArray.forEach((section, i) => {
          if (isElementInViewport(section)) {
            navArray.forEach((element) => {
              element.classList.remove("active");
            });
            navArray[i].classList.add("active");
          }
        });
      }

      window.addEventListener("scroll", updateActiveLink);
      updateActiveLink();
    }

    // ------------------------------------------------------
    // Section Animations
    {
      let sectionArray = Array.from(sections);

      function appearToTop() {
        if (window.scrollY > 120) {
          let toTop = document.getElementsByClassName("to-top")[0];
          toTop.style.opacity = "1";
          toTop.classList.add("animate", "toDown");
        } else {
          let toTop = document.getElementsByClassName("to-top")[0];
          toTop.style.opacity = "0";
          toTop.classList.remove("animate", "toDown");
        }
      }

      function isActive(index) {
        return navLinks[index].classList.contains("active");
      }

      function animateSections() {
        sectionArray.forEach((section, i) => {
          if (isActive(i)) {
            if (sectionEnimations[i].enter != "") {
              section.classList.remove("animate", sectionEnimations[i].exit);
              section.classList.add("animate", sectionEnimations[i].enter);
              section.style.opacity = "1";
            }
          } else {
            if (sectionEnimations[i].enter != "") {
              section.classList.remove("animate", sectionEnimations[i].enter);
              section.classList.add("animate", sectionEnimations[i].exit);
              section.style.opacity = "0";
            }
          }
        });
      }

      window.addEventListener("scroll", animateSections);
      window.addEventListener("scroll", appearToTop);
      animateSections();
    }
  });
}

function toggleFocus(element) {
  const inputIcon = element.parentNode;
  const icon = inputIcon.children[0];
  inputIcon.classList.toggle("inputfocused");
  icon.classList.toggle("iconfocused");
}

function alertMessage() {
  swal({
    icon: "error",
    title: "Oops...",
    text: "There is an empty field!",
  });
}

function submit() {
  if (document.querySelectorAll("textarea")[0].value == "") {
    alertMessage();
    return;
  }

  var info = [];

  document.querySelectorAll(".inputIcon input").forEach((element) => {
    if (element.value == "") {
      alertMessage();
      return;
    }
    info.push(element.value);
  });
  info.push(document.querySelectorAll("textarea")[0].value);

  var message = `  - Sender: ${info[0]}%0A  - Email: ${info[1]}%0A  - Phone: ${info[2]}%0A  - Body: ${info[3]}`;

  var token = "6354509058:AAEX7F7bsPDu2AH7X2Zis-Ynks1NlXhjbxM";
  var chatId = -991103490;
  var url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${message}`;

  let api = new XMLHttpRequest();
  api.open("GET", url, true);
  api.send();

  document.querySelectorAll(".inputIcon input").forEach((element) => {
    element.value = "";
  });
  document.querySelectorAll("textarea")[0].value = "";

  swal({
    icon: "success",
    title: "Successful process",
    text: "The message was sent successfully",
  });
}

function toggleNav() {
  document.querySelector("nav").classList.toggle("show");
}
