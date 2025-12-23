export class ContactForm {
  constructor(options = {}) {
    this.selectors = {
      form: options.formSelector || ".contact-form",
      formBox: options.formBoxSelector || ".contact-form-box",
      productButton: options.productButtonSelector || ".product-button",
      closeBtn: options.closeBtnSelector || ".close-btn",
      contentField: options.contentFieldSelector || ".contact-form-field",
      container: options.containerSelector || ".contact-form-container",
      formIdMap: options.formIdMap || {
        Visitor: "Visitor",
        "Business-Case": "Business-Case",
        Customer: "Customer",
        User: "User",
      },
    };

    this.callAllowed = !!options.callAllowed;
    this.togglers = {};
    this._continuePromise = null;
    this._cancelContinue = null;
    this.currentlyOpenForms = new Set();

    this._onClick = this._onClick.bind(this);
  }

  // ---------------- Init / Destroy ----------------
  init() {
    document.addEventListener("click", this._onClick);
  }

  destroy() {
    document.removeEventListener("click", this._onClick);
  }

  setCallAllowed(v = true) {
    this.callAllowed = !!v;
  }

  setRobotValue(value) {
    const forms = document.querySelectorAll(this.selectors.form);
    forms.forEach(form => {
      const robotInput = form.querySelector('input[name="Robot"]');
      if (robotInput) {
        robotInput.value = value || "";
      }
    });
  }

  // ---------------- UI helpers ----------------
  _getContainer() {
    return document.querySelector(this.selectors.container);
  }

  _getBoxByName(name) {
    const id = this.selectors.formIdMap[name] || name;
    return document.querySelector(
      `#${CSS.escape(id)}.${this.selectors.formBox.replace(/^\./, "")}`
    );
  }

  openForm(name) {
    const container = this._getContainer();
    if (!container) return false;
    const box = this._getBoxByName(name);
    container.classList.remove("hide");
    if (box) {
      box.classList.remove("hide");
      this.currentlyOpenForms.add(name);
      return true;
    }
    return false;
  }

  closeForm(name) {
    const container = this._getContainer();
    const box = this._getBoxByName(name);
    if (box) box.classList.add("hide");
    this.currentlyOpenForms.delete(name);
    if (container && this.currentlyOpenForms.size === 0)
      container.classList.add("hide");
  }

  async formComplete(requiredForms = ["Visitor", "Business-Case", "Customer", "User"]) {
    requiredForms.forEach(name => this.openForm(name));
    this.setCallAllowed(true);

    try {
      while (true) {
        await this.waitForContinue();

        const forms = {};
        const collected = {};
        let allFilled = true;

        for (const name of requiredForms) {
          const box = this._getBoxByName(name);
          const formEl = box
            ? box.querySelector(`${this.selectors.form}.language.active`)
            : null;

          forms[name] = formEl;

          if (!formEl || !this._isFormFilled(formEl)) {
            allFilled = false;
          } else {
            collected[name] = this._getFormData(formEl);
          }
        }

        if (allFilled) {
          requiredForms.forEach(name => this.closeForm(name));
          this.setCallAllowed(false);
          let submitForm = null;
          for (let i = requiredForms.length - 1; i >= 0; i--) {
            const f = forms[requiredForms[i]];
            if (f) {
              submitForm = f;
              break;
            }
          }
          if (requiredForms.includes("Visitor")) {
            const fullData = Object.assign({}, ...Object.values(collected));
            this.saveVisitorData(fullData);
          }
          if (requiredForms.includes("Business-Case")) {
            const fullData = Object.assign({}, ...Object.values(collected));
            this.saveBusinessCaseData(fullData);
          }
          if (submitForm) {
            console.log("Submitting final form from flow:", submitForm.action, submitForm);
            submitForm.submit();
          } else {
            console.warn("No submittable form found - nothing submitted.");
          }

          return { forms, data: collected };
        } else {
          alert("Udfyld venligst alle felter på de viste formularer før du fortsætter!");
        }
      }
    } catch (err) {
      console.warn("Form flow cancelled", err);
      requiredForms.forEach(name => this.closeForm(name));
      this.setCallAllowed(false);
      throw err;
    } finally {
      this.cancelWaitForContinue();
    }
  }



  waitForContinue(timeoutMs = 0) {
    if (this._continuePromise) return this._continuePromise;

    this._continuePromise = new Promise((resolve, reject) => {
      const continueHandler = ev => {
        cleanup();
        resolve(ev.detail || {});
      };

      const cancelHandler = ev => {
        cleanup();
        reject(new Error("User cancelled"));
      };

      const cleanup = () => {
        document.removeEventListener("cf:continue", continueHandler);
        document.removeEventListener("cf:cancel", cancelHandler);
        if (timer) clearTimeout(timer);
        this._continuePromise = null;
      };

      document.addEventListener("cf:continue", continueHandler);
      document.addEventListener("cf:cancel", cancelHandler);

      let timer = null;
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          cleanup();
          reject(new Error("waitForContinue timed out"));
        }, timeoutMs);
      }

      this._cancelContinue = () => {
        cleanup();
        reject(new Error("waitForContinue cancelled"));
      };
    });

    return this._continuePromise;
  }

  cancelWaitForContinue() {
    if (typeof this._cancelContinue === "function") {
      this._cancelContinue();
      this._cancelContinue = null;
    }
  }

  // ---------------- Click & Submit ----------------
  _onClick(e) {
    const btn = e.target.closest("[data-button], .close-btn");
    if (!btn) return;

    const form = btn.closest(this.selectors.form);
    if (!form) return;

    const dataButton = btn.dataset.button || (btn.classList.contains("close-btn") ? "close-button" : null);
    if (!dataButton) return;

    if (!btn.matches("button[type=submit], input[type=submit]")) e.preventDefault();

    switch (dataButton) {
      case "add-machine":
        this._handleItemAddition({ fieldButton: btn, inputKey: "machines" });
        break;
      case "add-tool":
        this._handleItemAddition({ fieldButton: btn, inputKey: "tools" });
        break;
      case "request":
        this._handleRequest({ btn });
        break;
      case "close-button":
        this.requestPasswordPopup();
        break;
      case "Create-User":
        this._handleCreateUserFlow();
        break;
      case "Order-List":
      case "Continue":
        this._handleContinueButton({ btn, form });
        break;
      case "Go-Back":
        this._handleGoBack();
        break;
      case "Login":
        this.handleLogin(form);
        break;
      default:
        break;
    }
  }

  gotoOrder() {
    window.location.href = "/html/contents/Configurator/Order.html";
  }

  _handleGoBack() {
    this.closeForm("User")
    this.openForm("Customer");
  }

  async handleLogin(form) {
    if (!form) return;

    // Sprog
    const rawLang =
      form.getAttribute("lang") ||
      form.querySelector('input[name="lang"]')?.value ||
      "dk";

    const allowedLangs = ["dk", "en", "de", "ua", "fr", "se"];
    const lang = allowedLangs.includes(rawLang) ? rawLang : "en";

    const clientMessages = {
      missing: {
        dk: "Udfyld både brugernavn og adgangskode.",
        en: "Please fill in both username and password.",
        de: "Bitte füllen Sie Benutzername und Passwort aus.",
        ua: "Заповніть ім’я користувача та пароль.",
        fr: "Veuillez remplir le nom d’utilisateur et le mot de passe.",
        se: "Fyll i både användarnamn och lösenord.",
      },
      technical: {
        dk: "Teknisk fejl. Prøv igen senere.",
        en: "Technical error. Please try again later.",
        de: "Technischer Fehler. Bitte versuchen Sie es später erneut.",
        ua: "Технічна помилка. Спробуйте пізніше.",
        fr: "Erreur technique. Veuillez réessayer plus tard.",
        se: "Tekniskt fel. Försök igen senare.",
      },
      network: {
        dk: "Der opstod en fejl ved login. Prøv igen.",
        en: "An error occurred during login. Please try again.",
        de: "Beim Login ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        ua: "Під час входу сталася помилка. Спробуйте ännu en gång.",
        fr: "Une erreur s’est produite lors de la connexion. Veuillez réessayer.",
        se: "Ett fel uppstod vid inloggning. Försök igen.",
      },
      fallbackInvalid: {
        dk: "Brugernavn eller adgangskode er forkert.",
        en: "Incorrect username or password.",
        de: "Benutzername oder Passwort ist falsch.",
        ua: "Невірне ім’я користувача або пароль.",
        fr: "Nom d’utilisateur ou mot de passe incorrect.",
        se: "Fel användarnamn eller lösenord.",
      },
    };

    const errorEl =
      form.querySelector(`.login-error[data-lang="${lang}"]`) ||
      form.querySelector(".login-error");

    const showError = (message) => {
      if (!errorEl) return;
      if (message) errorEl.textContent = message;
      errorEl.classList.add("show");
    };

    const hideError = () => {
      if (!errorEl) return;
      errorEl.classList.remove("show");
    };

    hideError();

    const username =
      (form.querySelector('input[name="Username"]')?.value || "").trim();
    const password =
      form.querySelector('input[name="Password"]')?.value || "";

    if (!username || !password) {
      showError(clientMessages.missing[lang]);
      return;
    }

    // Brug formens action – peger på /Login
    const action = form.getAttribute("action") || "/Login";

    const payload = new URLSearchParams();
    payload.append("Username", username);
    payload.append("Password", password);
    payload.append("lang", lang);

    try {
      const res = await fetch(action, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: payload.toString(),
        credentials: "include",
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        showError(clientMessages.technical[lang]);
        console.error("Login response was not valid JSON");
        return;
      }

      if (!res.ok || !data || !data.success) {
        showError(
          data && data.message
            ? data.message
            : clientMessages.fallbackInvalid[lang]
        );
        console.error("Login failed:", data);
        return;
      }

      // ✅ SUCCES: lad JavaScript stå for redirect
      const target = data.redirect || "/Dashboard";
      window.location.href = target;

    } catch (err) {
      console.error("AJAX login error:", err);
      showError(clientMessages.network[lang]);
    }
  }




  // ---------------- Handlers ----------------
  _handleItemAddition({ fieldButton, inputKey } = {}) {
    const container = (fieldButton && fieldButton.closest(".contact-form-field")) ||
      document.querySelector(`.contact-form-field input[data-name="${inputKey}"]`)?.closest(".contact-form-field");

    const inputElement = container?.querySelector(`[data-name="${inputKey}"]`) || document.querySelector(`[data-name="${inputKey}"]`);
    if (!container || !inputElement) return;

    const counterElement = container.querySelector(".content");

    if (!counterElement) return;

    // find or create .content-container wrapper
    let contentContainer = container.querySelector(".content-container");
    if (!contentContainer) {
      contentContainer = document.createElement("div");
      contentContainer.className = "content-container";
      counterElement.insertAdjacentElement("afterend", contentContainer);
    }

    // find or create .content-box list inside it
    let listContainer = contentContainer.querySelector(".content-box");
    if (!listContainer) {
      listContainer = document.createElement("ul");
      listContainer.className = "content-box";
      contentContainer.appendChild(listContainer);
    }


    const inputValue = inputElement.value.trim();
    if (!inputValue) return;

    const { li, span, btn } = this._createItem(inputValue, container);

    li.appendChild(span);
    li.appendChild(btn);
    listContainer.appendChild(li);

    inputElement.value = "";
    this._updateFieldState(container);
  }


  _createItem(value, field) {
    const li = document.createElement("li");
    li.className = "content-element";

    const span = document.createElement("span");
    span.textContent = value;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "close-button";
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"> <path d="M3 3 L21 21 M21 3 L3 21" /> </svg>`;
    btn.addEventListener("click", () => {
      li.remove();
      this._updateFieldState(field);
    });
    return { li, span, btn };
  }

  _updateFieldState(container) {
    const counterElement = container.querySelector(".content");
    const listContainer = container.querySelector(".content-box");
    const count = listContainer ? listContainer.querySelectorAll(".content-element").length : 0;

    const labelMatch = counterElement.textContent.match(/^(.+?)[\s:]*\d+/);
    const labelText = labelMatch ? labelMatch[1].trim() : "";

    counterElement.textContent = `${labelText}: ${count}`;
    container.classList.toggle("has-items", count > 0);
  }

  _handleRequest({ btn } = {}) {
    if (!btn) return;
    btn.classList.toggle("active");
    const fieldContainer = btn.closest(".contact-form-field");
    const labelEl = fieldContainer?.querySelector("label[for='request']");
    if (!labelEl) return;
    const isHidden = labelEl.classList.toggle("hide");
    this.togglers.Request = isHidden;
    labelEl.setAttribute("aria-hidden", isHidden ? "true" : "false");
  }

  _handleContinueButton({ btn, form } = {}) {
    if (!this.callAllowed) {
      alert("Call not allowed yet — form flow is paused.");
      return;
    }

    if (!form) form = btn?.closest(this.selectors.form);

    if (!form || !this._isFormFilled(form)) {
      alert("Udfyld venligst alle felter før du fortsætter!");
      return;
    }

    this._dispatchEvent("cf:continue", { form, data: this._getFormData(form) });
  }

  _handleCreateUserFlow() {
    this.closeForm("Customer")
    this.openForm("User");
  }

  // ---------------- Form utils ----------------
  _isFormFilled(form) {
    if (!form) return false;
    const requiredEls = Array.from(form.querySelectorAll("[required]"));
    if (requiredEls.length === 0) return true;

    return requiredEls.every(input => {
      const name = input.name;
      if (!name) return (input.value ?? "").trim() !== "";
      if (name === "machines" || name === "tools") {
        const fieldContainer = input.closest(".contact-form-field");
        return fieldContainer?.querySelectorAll(".content-box .content-element").length > 0;
      }
      return ((input.value ?? "").trim() !== "");
    });
  }

  _getFormData(form) {
    if (!form) return {};
    const inputs = Array.from(form.querySelectorAll("[name]"));
    const data = {};
    for (const input of inputs) {
      if (input.type?.toLowerCase() === "hidden") continue;
      const name = input.name;
      if (!name) continue;
      if (name === "machines" || name === "tools") {
        const fieldContainer = input.closest(".contact-form-field");
        const listItems = fieldContainer?.querySelectorAll(".content-box .content-element span") ?? [];
        data[name] = Array.from(listItems).map(li => li.textContent.trim()).filter(Boolean);
      } else {
        data[name] = (input.value ?? "").trim();
      }
    }
    return data;
  }

  _dispatchEvent(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }

  saveVisitorData(data) {
    try {
      if (!data || typeof data !== "object") return;
      localStorage.setItem("VisitorData", JSON.stringify(data));
      console.debug("Visitor data saved to localStorage:", data);
    } catch (err) {
      console.warn("Failed to save VisitorData:", err);
    }
  }

  saveBusinessCaseData(data) {
    try {
      if (!data || typeof data !== "object") return;
      localStorage.setItem("BusinessCaseData", JSON.stringify(data));
      console.debug("Business Case data saved to localStorage:", data);
    } catch (err) {
      console.warn("Failed to save BusinessCaseData:", err);
    }
  }

  // ---------------- Password popup ----------------
  async requestPasswordPopup(message = "Write a password to continue", validPasswords = ["1", "a"]) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(".cf-modal")) return reject("Popup already open");

      const modal = document.createElement("form");
      modal.className = "cf-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.style.position = "fixed";
      modal.style.top = "50%";
      modal.style.left = "50%";
      modal.style.transform = "translate(-50%, -50%)";
      modal.style.background = "#fff";
      modal.style.padding = "1.5rem";
      modal.style.borderRadius = "10px";
      modal.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
      modal.style.zIndex = "10000";
      modal.style.textAlign = "center";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = message;
      input.style.marginBottom = "1rem";
      input.style.display = "block";
      input.style.width = "100%";

      const submitBtn = document.createElement("button");
      submitBtn.type = "submit";
      submitBtn.textContent = "Continue";
      submitBtn.style.cursor = "pointer";

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.textContent = "Close";
      closeBtn.style.marginLeft = "1rem";
      closeBtn.style.cursor = "pointer";

      modal.appendChild(input);
      modal.appendChild(submitBtn);
      modal.appendChild(closeBtn);
      document.body.appendChild(modal);

      closeBtn.addEventListener("click", () => {
        document.body.removeChild(modal);
        reject("User cancelled");
      }, { once: true });

      modal.addEventListener("submit", e => {
        e.preventDefault();
        const pw = (input.value || "").trim().toLowerCase();
        if (validPasswords.includes(pw)) {
          document.body.removeChild(modal);
          this._dispatchEvent("cf:cancel");
          resolve(true);
        } else {
          alert("You must enter the correct code to continue.");
        }
      });
    });
  }
}
