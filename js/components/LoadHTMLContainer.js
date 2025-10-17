// LoadHTMLContainer.js
export default class LoadHTMLContainer {
    constructor() {
        this.htmlTasks = [];
        this.jsTasks = [];
    }

    /**
     * Add HTML fragment task.
     * @param {string} selector - Target CSS selector for HTML
     * @param {string} src - URL of the HTML file to load
     * @param {string|null} dst - Optional container HTML to load first
     */
    addHTML(selector, src, dst = null) {
        if (!selector || !src) throw new Error("addHTML requires selector and src");
        this.htmlTasks.push({ selector, src, dst });
    }

    /**
     * Add JS script task.
     * @param {string} src - URL of JS file
     */
    addJS(src) {
        if (!src) throw new Error("addJS requires src");
        this.jsTasks.push(src);
    }

    /**
     * Run all HTML and JS tasks sequentially.
     */
    async run() {
        // --- Load HTML fragments sequentially ---
        for (const { selector, src, dst } of this.htmlTasks) {
            try {
                const html = await this.fetchText(src);

                // Ensure container exists (load dst if provided)
                const target = dst
                    ? await this.ensureContainerLoaded(dst, selector)
                    : document.querySelector(selector);

                if (!target) {
                    console.warn(`⚠️ Target not found for selector: ${selector}`);
                    continue;
                }

                target.innerHTML = html;
                this._executeInlineScripts(target);
            } catch (err) {
                console.error(`❌ Failed to load HTML (${src}):`, err);
            }
        }
        this.htmlTasks = [];

        // --- Load external JS scripts sequentially at end of body ---
        for (const src of this.jsTasks) {
            try {
                await this.loadScript(src);
            } catch (err) {
                console.error(`❌ Failed to load JS (${src}):`, err);
            }
        }
        this.jsTasks = [];
    }

    /**
     * Ensure a destination container is loaded, and return target element.
     */
    async ensureContainerLoaded(containerSrc, selector) {
        let target = document.querySelector(selector);
        if (target) return target;

        const html = await this.fetchText(containerSrc);
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        document.body.appendChild(wrapper);

        return wrapper.querySelector(selector);
    }

    /**
     * Fetch text from URL.
     */
    async fetchText(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
        return res.text();
    }

    /**
     * Load external JS script sequentially at the end of body.
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.type = "module";
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.body.appendChild(script); // append at end of body
        });
    }

    /**
     * Execute inline <script> tags inside a container at the end of body.
     */
    _executeInlineScripts(container) {
        const scripts = Array.from(container.querySelectorAll("script"));
        for (const oldScript of scripts) {
            const script = document.createElement("script");
            script.type = oldScript.type || "text/javascript";
            if (oldScript.src) {
                script.src = oldScript.src;
                script.type = oldScript.type || "module";
            } else {
                script.textContent = oldScript.textContent;
            }
            document.body.appendChild(script); // append at end of body
            oldScript.remove();
        }
    }
}
