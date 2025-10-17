// LoadHTMLContainer.js
export default class LoadHTMLContainer {
    constructor() {
        this.htmlTasks = [];
        this.jsTasks = [];
    }

    /**
     * Add HTML fragment task.
     * @param {string} selector - Target element selector
     * @param {string} src - URL of HTML file
     */
    addHTML(selector, src) {
        if (!selector || !src) throw new Error("addHTML requires selector and src");
        this.htmlTasks.push({ selector, src });
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
     * Run all tasks sequentially.
     */
    async run() {
        // --- Load HTML fragments ---
        for (const { selector, src } of this.htmlTasks) {
            try {
                const html = await this.fetchText(src);
                const target = document.querySelector(selector);
                if (!target) {
                    console.warn(`⚠️ Target not found: ${selector}`);
                    continue;
                }
                target.innerHTML = html;
                this._executeInlineScripts(target);
            } catch (err) {
                console.error(`❌ Failed to load HTML (${src}):`, err);
            }
        }
        this.htmlTasks = [];

        // --- Load JS scripts sequentially ---
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
     * Fetch text from URL.
     */
    async fetchText(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
        return res.text();
    }

    /**
     * Load external JS script sequentially.
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.type = "module";
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    /**
     * Execute inline <script> tags inside a container.
     */
    _executeInlineScripts(container) {
        const scripts = Array.from(container.querySelectorAll("script"));
        scripts.forEach(oldScript => {
            const script = document.createElement("script");
            if (oldScript.src) {
                script.src = oldScript.src;
                script.type = oldScript.type || "text/javascript";
            } else {
                script.textContent = oldScript.textContent;
            }
            oldScript.replaceWith(script);
        });
    }
}
