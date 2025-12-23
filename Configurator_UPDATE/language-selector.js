export class LanguageSelector {
  constructor() {
    this.defaultLang = "en";
    this.currentLang = null;
    this.isdropdown=true;
    this.languageButton = document.querySelector(".header-language-button");
    this.dropdownMenu = document.querySelector(".flags-dropdown");
    this.flagMap = this.extractFlagMapFromDOM();

    console.log("🔧 LanguageSelector initialized");
  }

  extractFlagMapFromDOM() {
    const flagMap = {};
    const flagElements = document.querySelectorAll(
      ".flags-dropdown a[language]"
    );

    flagElements.forEach((el) => {
      const lang = el.getAttribute("language");
      const img = el.querySelector("img");
      if (lang && img?.src) {
        flagMap[lang] = img.getAttribute("src");
        console.log(`🌍 Found flag for language: ${lang}`);
      }
    });

    return flagMap;
  }

  getValidBrowserLang() {
    const lang = (
      navigator.userLanguage ||
      navigator.language ||
      this.defaultLang
    )
      .slice(0, 2)
      .toLowerCase();
    console.log(`🧭 Browser language detected: ${lang}`);
    return this.flagMap[lang] ? lang : this.defaultLang;
  }

  async setLanguage() {
    let lang = localStorage.getItem("language");

    if (!lang) {
      lang = this.getValidBrowserLang();
      localStorage.setItem("language", lang);
    }

    if (!this.flagMap[lang]) lang = this.defaultLang;
    this.currentLang = lang;

    console.log(`🌐 Setting language to: ${lang}`);
    this.updateFlagUI(lang);
    this.updateURL(lang);
    this.toggleLanguageContent(lang);
  }

  updateFlagUI(lang) {
    const currentFlag = document.querySelector("#current-language-flag img");
    if (currentFlag) {
      currentFlag.src = this.flagMap[lang];
      currentFlag.alt = `${lang.toUpperCase()} flag`;
      console.log(`🚩 Updated flag UI to: ${lang}`);
    }
  }

  updateURL(lang) {
    const newURL = `${window.location.pathname}?lang=${lang}`;
    window.history.replaceState({}, "", newURL);
    console.log(`🔗 Updated URL to: ${newURL}`);
  }

  toggleLanguageContent(lang) {
    document.querySelectorAll(".language").forEach((el) => {
      const isActive = el.getAttribute("lang") === lang;
      el.classList.toggle("active", isActive);
    });
    console.log(`📑 Toggled content visibility for language: ${lang}`);
  }

  async changeLanguage(newLang) {
    if (!this.flagMap[newLang]) {
      console.warn(`⚠️ Unknown language selected: ${newLang}`);
      return;
    }

    console.log(`🏳️ Selected flag: ${newLang}`);
    localStorage.setItem("language", newLang);
    await this.setLanguage();

    this.hideDropdown();
  }

  toggleDropdown() {
    if (this.isdropdown) {
      this.hideDropdown();
    } else {
      this.showDropdown();
    }
  }

  showDropdown() {
    this.dropdownMenu.classList.add("visible");
    this.isdropdown = true;
  }

  hideDropdown() {
    this.dropdownMenu.classList.remove("visible");
    this.isdropdown = false;
  }
  setupEventListeners() {
    console.log("🧷 Setting up event listeners");

    // Klik på sprogvælger-knappen toggler dropdown
    this.languageButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Klik på sprog-flag i dropdown
    const flagElements = document.querySelectorAll(".flags-dropdown a[language]");
    flagElements.forEach((el) => {
      const lang = el.getAttribute("language");

      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.changeLanguage(lang);

        const toggle = document.getElementById("language-toggle");
        if (toggle) toggle.checked = false;
      });
    });

    // Klik udenfor dropdown lukker den
    document.addEventListener("click", function (event) {
      const toggle = document.querySelector(".language-toggle");
      const languageButton = document.querySelector(".header-language-button");

      if (!toggle || !toggle.checked) return;

      if (event.target.closest(".flags-dropdown a")) {
        toggle.checked = false;
        return;
      }

      if (!event.target.closest(".header-language-button")) {
        toggle.checked = false;
      }
    });

    // Skjul dropdown ved scroll
    document.addEventListener("scroll", () => {
      if(this.isdropdown) this.hideDropdown();
    });
  }

  refreshLanguageVisibility() {
    this.toggleLanguageContent(this.currentLang);
  }

  async initialize() {
    await this.setLanguage();
    this.setupEventListeners();
  }
}