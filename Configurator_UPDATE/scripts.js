/* Toggle between showing and hiding the navigation menu links when the user clicks on the hamburger menu / bar icon */
function burgerMenu() {
  var x = document.getElementById("myLinks");
  if (x.style.display === "block") {
    x.style.display = "none";
  } else {
    x.style.display = "block";
  }
}

/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
let sidebarActive = 0;

function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  //document.getElementById("home-container-id").style.marginRight = "0";
  document.getElementsByClassName("hero")[0].style.paddingRight = "0";
  sidebarActive = False;
}

function openNav() {
  var deviceWidth = window.innerWidth > 0 ? window.innerWidth : screen.width;
  var sidebarSize = "20em";
  sidebarActive = 1;

  // if (deviceWidth < 768) {
  //     sidebarSize = "50%";
  // }

  if (
    document.getElementById("mySidebar").style.getPropertyValue("width") >=
    sidebarSize
  ) {
    closeNav();
  } else {
    document.getElementById("mySidebar").style.width = sidebarSize;
    // document.getElementById("Header").style.marginRight = "0px";

    if (deviceWidth > 768) {
      document.getElementsByClassName("hero")[0].style.paddingRight =
        sidebarSize;
    }
  }
}

window.onscroll = function () {
  closeNavScroll();
};

// Globale (placer ét sted, fx øverst i scripts.js)
let lastScrollY = window.scrollY;

function closeNavScroll() {
  const deviceWidth = window.innerWidth > 0 ? window.innerWidth : screen.width;
  if (deviceWidth <= 768) return;

  const hero = document.querySelector(".hero");
  const sidebar = document.getElementById("mySidebar");

  // Alle sticky knapper
  const stickyButtons = document.querySelectorAll(".sticky-booking-button");
  if (stickyButtons.length === 0) return;

  const currentY = window.scrollY;
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollingDown = currentY > lastScrollY;

  const nearBottom =
    window.innerHeight + currentY >= document.body.offsetHeight - 200;

  // ----------------------------------------------------
  // VIS / SKJUL sticky-knapper
  // ----------------------------------------------------
  stickyButtons.forEach(btn => {
    if (nearBottom && scrollingDown) {
      btn.classList.add("visible");
    } else if (nearBottom && !scrollingDown) {
      btn.classList.remove("visible");
    }
  });

  // ----------------------------------------------------
  // HERO / SIDEBAR lukning
  // ----------------------------------------------------
  if (scrollTop > 350) {
    if (typeof sidebarActive !== "undefined" && sidebarActive === 1) {
      if (hero) hero.style.paddingRight = "0";
      if (sidebar) sidebar.style.width = "0";
    }
  }

  lastScrollY = currentY;
}

var prevScrollpos = window.pageYOffset;
var limitScrollPos = 0;
// let limitScrollPos;

window.addEventListener("scroll", function () {
  var header = document.getElementById("Header");
  var currentScrollPos = window.pageYOffset;
  var subPageNavbar = document.getElementsByClassName("subpage-navbar")[0];
  if (!header) return;
  let headerHeight = header.offsetHeight;
  if (prevScrollpos > currentScrollPos) {
    limitScrollPos = limitScrollPos + prevScrollpos - currentScrollPos;
    if (limitScrollPos > 200 || currentScrollPos < limitScrollPos) {
      header.style.transform = "translateY(0%)";
      limitScrollPos = 0;
      if (subPageNavbar && currentScrollPos != 0) {
        this.document.getElementsByClassName(
          "subpage-navbar"
        )[0].style.transform = `translateY(${headerHeight}px)`;
      }
    }
  } else {
    header.style.transform = "translateY(-110%)";
    if (subPageNavbar) {
      this.document.getElementsByClassName(
        "subpage-navbar"
      )[0].style.transform = "translateY(0px)";
    }
    // limitScrollPos = 0;
  }
  if (currentScrollPos < 500) {
    header.style.transform = "translateY(0%)";
  }

  prevScrollpos = currentScrollPos;
});

// var pics = document.getElementById("product-image");

var pics = document.getElementsByClassName("product-image");

var height, half;

window.addEventListener("resize", adjustHeightVars);
window.addEventListener("scroll", fadeBox);

function fadeBox() {
  for (var i = 0; i < pics.length; i++) {
    var x = pics[i].offsetTop - height / 1.25;
    var y = window.pageYOffset;
    if (y >= x) {
      pics[i].classList.add("fadein");
    }
  }
}

function adjustHeightVars() {
  height = window.innerHeight;
  half = height * 0.35;
}

adjustHeightVars();



function expand_text(event) {
  const targetCard = event.currentTarget;

  // Loop through all images and resize them
  const cards = document.querySelectorAll(".areas-card");
  const card_text = document.querySelectorAll(".areas-card-list");
  const card_text_container = document.querySelectorAll(".areas-card-text");

  cards.forEach((card, idx) => {
    if (card === targetCard) {
      let li_no = card_text[idx].querySelectorAll("*").length;
      card_text_container[idx].style.transform = `translate( -50%, -${
        li_no * 1.5
      }rem)`;

      card_text[idx].style.opacity = "1";
      card.firstElementChild.style.filter = "blur(2px) brightness(80%)";
    } else {
      card_text[idx].style.opacity = "0";
    }
  });

  targetCard.addEventListener("mouseout", resetCards);

  function resetCards() {
    // Loop through all images and reset their sizes
    cards.forEach((card, idx) => {
      card_text_container[idx].style.transform = "";
      card.style.filter = "";
      card_text[idx].style.opacity = "";
      card.firstElementChild.style.filter = "";
    });
    // Remove the mouseout event listener
    targetCard.removeEventListener("mouseout", resetCards);
  }
}

function redirectSizeCheck(event) {
  // console.log(event.currentTarget.firstElementChild.textContent);

  if (window.innerWidth < 1100) {
    event.preventDefault();
  } else {
    // redirect to products.html
    window.location.href =
      "/" + event.currentTarget.getAttribute("id") + ".html";
  }
}

function expandDropdown(event) {
  const targetDropdown = event.currentTarget;

  if (targetDropdown.classList.contains("burger-dropdown")) {
    dropdown = targetDropdown.querySelector(".burger-dropdown-list");
    dropdown.classList.toggle("dropdown-active");
  }
  //   dropdown = document.querySelector('.burger-dropdown-list');
  //   if (dropdown.classList.contains('dropdown-active')) {
  //     dropdown.classList.remove('dropdown-active');
  //     console.log("disappear")
  //   }
  //   else {
  //   console.log("active")

  //   dropdown.classList.add('dropdown-active');
  //   }
  // }
  // else {
  // }
}

function changeService(event) {
  const targetService = event.currentTarget;
  // console.log(targetService);

  // Loop through all images and resize them
  const service_selector = document.querySelectorAll(".service-button");
  const services = document.querySelectorAll(".service-content");
  const table_text = document.querySelectorAll(".service-text");

  service_selector.forEach((service, idx) => {
    // console.log(targetTable[idx].classList);
    console.log(service);

    if (service === targetService) {
      service.classList.add("active");
      services[idx].style.display = "";
      service.querySelector("img").style.transform = "scale(1.1)";
      // services.querySelector('p').style.transform = "translateY(-2px)";
    } else {
      service.classList.remove("active");
      services[idx].style.display = "none";
      service.querySelector("img").style.transform = "scale(1.0)";
    }
  });
}

function changeTable(event) {
  const targetTable = event.currentTarget;
  console.log("change table");

  // Loop through all images and resize them
  const table_selector = document.querySelectorAll(".table-wrapper button");
  const tables = document.querySelectorAll(".table-content");
  const table_text = document.querySelectorAll(".table-text");

  table_selector.forEach((table, idx) => {
    // console.log(targetTable[idx].classList);

    if (table === targetTable) {
      table.classList.add("active");
      tables[idx].style.display = "";
    } else {
      table.classList.remove("active");
      tables[idx].style.display = "none";
    }
  });
}

function start_playback(event) {
  const playbutton = event.currentTarget;
  vidPlayer = playbutton.parentElement;
  video = vidPlayer.lastElementChild;
  video.play();
  playbutton.style.display = "none";

  video.addEventListener("pause", function () {
    playbutton.style.display = "";
  });
}

let carruselNo = 0;

function rotate_carrusel(event) {
  const targetButton = event.currentTarget;
  var direction = 0;
  const targetCarrusel = targetButton.parentElement.parentElement;
  const carruselCard = targetCarrusel.querySelectorAll(".carrusel-card");
  const cardStyle = window.getComputedStyle(carruselCard[0]);
  const cardWidth = parseInt(cardStyle.width);
  const viewPort = parseInt(window.getComputedStyle(targetCarrusel).width);
  const maxMoves = carruselCard.length - Math.floor(viewPort / cardWidth) + 1;
  if (targetButton.classList.contains("carrusel-control-left")) {
    if (carruselNo == 0) {
      return;
    }
    direction = 1;
    carruselNo = carruselNo - 1;
  } else {
    if (carruselNo === maxMoves) {
      return;
    }
    direction = -1;
    carruselNo = carruselNo + 1;
  }

  const scrollbar = targetCarrusel.querySelector(".scrollbar");
  // const sliderStep = (viewPort/window.getComputedStyle(scrollbar).width) / maxMoves; // not correct...
  const sliderStep = (viewPort - cardWidth) / (maxMoves + 1);
  console.log(sliderStep);
  const cardTransform = cardWidth * -carruselNo;

  var newTransform = 0;

  // console.log(cardWidth);
  carruselCard.forEach((card, idx) => {
    // get fith element of the transform matrix
    if (cardTransform === undefined) {
      newTransform = cardWidth * direction;
    } else {
      if (direction === 1) {
        newTransform = cardTransform + cardWidth;
      } else {
        newTransform = cardTransform - cardWidth;
      }
    }
    // console.log("new transform:", newTransform);
    // window.getComputedStyle(card).transform;
    // card.style.transform = `translateX(${newTransform * -1}px)`;
    card.style.transform = `translateX(${cardTransform}px)`;
  });
  scrollbar.style.transform = `translateX(${sliderStep * carruselNo}px)`;
}

function scroll_carrusel(event, distance = 200) {
  console.log(event.currentTarget.classList);
  if (event.currentTarget.classList.contains("carrusel-control-left")) {
    direction = -1;
  } else {
    direction = 1;
  }
  const carrusel = document.querySelector(".home-carrusel");
  carrusel.scrollBy({
    top: 0,
    left: distance * direction,
    behavior: "smooth",
  });
}

function scroll_carrusel_id(event, distance = 200) {
  let parentID = event.currentTarget.parentElement.id;
  if (event.currentTarget.classList.contains("carrusel-control-left")) {
    direction = -1;
  } else {
    direction = 1;
  }
  const carrusel = document.querySelector(`.home-carrusel#${parentID}`);

  carrusel.scrollBy({
    top: 0,
    left: distance * direction,
    behavior: "smooth",
  });
}

function change_assembly(event) {
    const clickedDot = event.target;
    const targetId = clickedDot.getAttribute("data-target");

    // Reset all states
    document.querySelectorAll(".assembly-image-dots").forEach(dot => dot.classList.remove("active-dot"));
    document.querySelectorAll(".assembly-info").forEach(info => info.classList.remove("active-assembly"));

    // Activate all dots linked to the same info section
    document.querySelectorAll(`.assembly-image-dots[data-target="${targetId}"]`).forEach(dot => {
        dot.classList.add("active-dot");
    });

    // Show corresponding info box
    const infoBox = document.getElementById(targetId);
    if (infoBox) infoBox.classList.add("active-assembly");
}


function rotate_assembly(event) {
  const target_button = event.currentTarget;
  const assembly_selector =
    target_button.parentElement.querySelectorAll(".assembly-info");
  const assembly_dots = document.querySelectorAll(".assembly-image-dots");
  const active_assembly =
    target_button.parentElement.querySelector(".active-assembly");
  const assembly_id = active_assembly.getAttribute("id");
  let direction = 0;

  if (target_button.getAttribute("id") === "left") {
    direction = -1;
  } else {
    direction = 1;
  }
  let next_assembly_idx = -1;
  assembly_selector.forEach((assembly, idx) => {
    if (assembly.getAttribute("id") === assembly_id) {
      assembly.classList.remove("active-assembly");
      assembly_dots[idx].classList.remove("active-dot");
      // assembly_dots[idx].style.left = '';

      // add active class to next assembly if it isn't the last one
      if (idx + direction < assembly_selector.length && idx + direction >= 0) {
        next_assembly_idx = idx + direction;
      }
      // if it is the last one, add active class to the first one
      else if (idx + direction >= assembly_selector.length) {
        next_assembly_idx = 0;
      }
      // if it is the first one, add active class to the last one
      else if (idx + direction < 0) {
        next_assembly_idx = assembly_selector.length - 1;
      }
    }
  });
  assembly_selector[next_assembly_idx].classList.add("active-assembly");
  assembly_dots[next_assembly_idx].classList.add("active-dot");
  // switch(assembly_id){
  //   case "mix-cleaner":
  //   assembly_dots[next_assembly_idx].style.left = '79%';
  //   break;
  //   case "depot-boks":
  //   assembly_dots[next_assembly_idx].style.left = '70.5%';
  //   break;
  //   case "pickup-brush":
  //   assembly_dots[next_assembly_idx].style.top = '79 !important%';
  //   break;
  // }
}

function openAccordion(event) {
  open_accordion_content(event.currentTarget);
}

function open_accordion_content(target) {
  const targetAccordion = target;
  const icon = targetAccordion.querySelector(".open-close-icon");
  const accordionContent = targetAccordion.lastElementChild;
  console.log(accordionContent);

  if (accordionContent.classList.contains("open-accordion")) {
    accordionContent.classList.remove("open-accordion");
    accordionContent.style.transitionDuration = "1.0s";
    icon.style.transform = "rotate(0deg)";
  } else {
    accordionContent.classList.add("open-accordion");
    accordionContent.style.display = "block";
    icon.style.transform = "rotate(45deg)";
  }
}

// function open_accordion_content(target) {
//   const targetAccordion = target
//   const icon = targetAccordion.querySelector('.open-close-icon');
//   const accordionContent = targetAccordion.lastElementChild;
//   console.log(accordionContent);

//   if (accordionContent.classList.contains('open-accordion')) {
//     accordionContent.classList.remove('open-accordion');
//     accordionContent.style.maxHeight = accordionContent.clientHeight + 'px'; // virker ikke....
//     accordionContent.style.transitionDuration = "1.0s";
//     accordionContent.style.maxHeight = '0px';
//     icon.style.transform = "rotate(0deg)";

//   } else {

//     accordionContent.classList.add('open-accordion');
//     icon.style.transform = "rotate(45deg)";
//     accordionContent.style.maxHeight = '500px';

//   }
// }

function scroll_to_accordion(event) {
  const scrollTarget = event.currentTarget;
  const targetID = scrollTarget.parentElement.getAttribute("id");
  const targetAccordion = document.getElementById(
    targetID + "-data"
  ).parentElement;
  const icon = targetAccordion.querySelector(".open-close-icon");
  const accordionContent = targetAccordion.lastElementChild;
  accordionContent.classList.add("open-accordion");
  icon.style.transform = "rotate(45deg)";
  accordionContent.style.maxHeight = "500px";
  // const accordionContent = targetAccordion.lastElementChild;
  // accordionContent.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
}

$("input.before-after-slider").on("input change", function (event) {
  const $element = $(this).closest("div.before-after-container");
  const slider = event.target;
  const $before = $element.find("div.before");
  const $button = $element.find("div.before-after-slider-button");

  // Get pixel width of the slider track
  const sliderWidth = $(slider).width();
  // Value between 0–100
  const percent = parseFloat(slider.value);

  // Convert % to exact pixel position
  const posPx = (percent / 100) * sliderWidth;

  // Apply pixel-precise width to the before image
  $before.css({ width: `${posPx}px` });

  // Move round handle accordingly (half of button width = 18px)
  $button.css({ left: `${posPx - 18}px` });
});

function open_popup(event) {
  // Get references to the modal, button, and close button
  console.log(event);
  const target_button = event.currentTarget;
  var modal = document.getElementById(
    target_button.getAttribute("id") + "-modal"
  );

  var closeBtn = modal.getElementsByClassName("popup-close")[0];

  // When the button is clicked, display the modal

  modal.style.display = "block";

  // When the close button is clicked, hide the modal
  closeBtn.onclick = function () {
    modal.style.display = "none";
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

function open_popup_id(id) {
  // Get references to the modal, button, and close button
  var modal = document.getElementById(id + "-modal");

  var closeBtn = modal.getElementsByClassName("popup-close")[0];

  // When the button is clicked, display the modal

  modal.style.display = "block";

  // When the close button is clicked, hide the modal
  closeBtn.onclick = function () {
    modal.style.display = "none";
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

window.onscroll = function () {
  subpage_navbar_follow();
};

function subpage_navbar_follow() {
    // Get the navbar element
    var navbar = document.getElementsByClassName("subpage-navbar");
    if (!navbar[0]) return; // Guard clause: exit if navbar doesn't exist

    var navbarEl = navbar[0];
    var viewPortHeight = document.documentElement.clientHeight;
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

    if (scrollTop > viewPortHeight - navbarEl.offsetHeight) {
        // Fix navbar to top when scrolling past viewport
        navbarEl.style.position = "fixed";
        navbarEl.style.top = "0";
        navbarEl.style.bottom = "unset";
        navbarEl.style.width = "100%";
        // navbarEl.style.boxShadow = "0px 0px 10px 0px rgba(0,0,0,0.75)";
    } else {
        // Reset navbar to bottom position
        navbarEl.style.position = "absolute";
        navbarEl.style.top = "unset";
        navbarEl.style.bottom = "0";
        navbarEl.style.width = "100%";
        navbarEl.style.boxShadow = "none";
        navbarEl.style.transform = "translateY(0)";
    }
}

let slideIndex = 1;
showSlide(slideIndex);

function changeSlide(n) {
  showSlide((slideIndex += n));
}

function currentSlide(n) {
  showSlide((slideIndex = n));
}

function showSlide(n) {
  const slides = document.getElementsByClassName("hero-slide");
  const dots = document.getElementsByClassName("hero-dot");

  if (slides.length < 1) return; // <-- check first, using .length not .length()

  if (n > slides.length) {
    slideIndex = 1;
  }
  if (n < 1) {
    slideIndex = slides.length;
  }

  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }

  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.remove("hero-active");
  }

  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].classList.add("hero-active");
}
