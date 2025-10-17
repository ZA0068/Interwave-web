// LoadHTMLContainer.js
export default class LoadHTMLContainer {
    constructor() {
        this.tasks = [];   // HTML tasks
        this.scripts = []; // JS scripts to load
    }

    /**
     * Add an HTML or JS task.
     * @param {string|null} selector - Target CSS selector for HTML, or null for JS
     * @param {string} src - URL of HTML or JS file
     * @param {string|null} dst - Optional container HTML file to load first (HTML only)
     */
    add(selector, src, dst = null) {
        if (typeof src !== "string") {
            throw new Error("add() expects src as a string URL");
        }

        // JS task: selector is null or src ends with .js
        if (!selector || src.endsWith(".js")) {
            this.scripts.push(src);
            return;
        }

        // HTML task
        this.tasks.push({ selector, src, dst });
    }

    /**
     * Load all HTML fragments and JS scripts sequentially.
     */
    async run() {
        // --- Load HTML ---
        for (const task of this.tasks) {
            try {
                const html = await this.fetchText(task.src);

                // Resolve target
                let target;
                if (task.dst && task.dst.endsWith(".html")) {
                    target = await this.ensureContainerLoaded(task.dst, task.selector);
                } else {
                    target = document.querySelector(task.selector);
                }

                if (!target) {
                    console.warn(`⚠️ Target not found for selector: ${task.selector}`);
                    continue;
                }

                target.innerHTML = html;

                // Execute inline <script> in loaded HTML
                this._executeInlineScripts(target);
            } catch (err) {
                console.error(`❌ Failed to load HTML (${task.src}):`, err);
            }
        }
        this.tasks = [];

        // --- Load JS scripts ---
        for (const src of this.scripts) {
            try {
                const js = await this.fetchText(src);
                const scriptEl = document.createElement("script");
                scriptEl.textContent = js;
                document.body.appendChild(scriptEl);
            } catch (err) {
                console.error(`❌ Failed to load JS (${src}):`, err);
            }
        }
        this.scripts = [];
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
