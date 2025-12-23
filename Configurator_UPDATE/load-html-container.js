import { LanguageSelector } from "./language-selector.js";

export default class LoadHTMLContainer {
    constructor() {
        this.loadedElements = {};
        this.tasks = [];
        this.scripts = [];
    }

    insertHTML(selector, src, dst = null) {
        this.tasks.push({ selector, src, dst });
    }

    addJavaScript(src, isModule = false) {
        this.scripts.push({ src, isModule });
    }


    async run() {
        // Load HTML
        for (const task of this.tasks) {
            try {
                const response = await fetch(task.src);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const htmlContent = await response.text();

                let target;
                if (task.dst && task.dst.endsWith(".html")) {
                    target = await this.ensureContainerLoaded(task.dst, task.selector);
                } else {
                    target = document.querySelector(task.selector);
                }

                if (!target) {
                    console.warn(`Target element not found for selector: ${task.selector}`);
                    continue;
                }

                target.innerHTML = htmlContent;
                this.loadedElements[task.selector] = target;

            } catch (err) {
                console.error(`Failed to load HTML from ${task.src}:`, err);
            }
        }

        this.tasks = [];

        for (const { src, isModule } of this.scripts) {
            try {
                await this._appendScript(src, isModule);
            } catch (err) {
                console.error(`❌ Failed to append script ${src}:`, err);
            }
        }


        if (typeof LanguageSelector !== "undefined" && !window.langManager) {
            window.langManager = new LanguageSelector();
            await window.langManager.initialize();
        }
    }

    async ensureContainerLoaded(containerSrc, selector) {
        let target = document.querySelector(selector);
        if (target) return target;

        const response = await fetch(containerSrc);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const htmlContent = await response.text();

        const wrapper = document.createElement("div");
        wrapper.innerHTML = htmlContent;
        document.body.appendChild(wrapper);

        return wrapper.querySelector(selector);
    }

    _appendScript(src, isModule = false) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = false; // preserve execution order
            if (isModule) script.type = "module"; // ✅ mark it as a module
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.body.appendChild(script);
        });
    }


}
