import { APICALL, SYMBOLS, EXPORTTYPE, FeaturesNames } from "./api_container.js";
import { PDFExporter } from "./PDFExporter.js";

export class Product {

    constructor(name = "") {
        this.name = name;
        this.createdAt = new Date();
        this.features = {};
        this.bitindex = {};
        this.id = null;
    }

    toSymbols(num) {
        const alpha = SYMBOLS;
        const base = alpha.length;
        let result = '';
        do {
            result = alpha[num % base] + result;
            num = Math.floor(num / base);
        } while (num > 0);
        return result;
    }

    padSymbols(str, len) {
        return str.padStart(len, SYMBOLS[0]);
    }

    #generateRandomBlock(length) {
        const alpha = SYMBOLS;
        const arr = new Uint32Array(length);
        crypto.getRandomValues(arr);
        return Array.from(arr, v => alpha[v % alpha.length]).join('');
    }

    #productTypeCode() {
        if (!this.bitindex || Object.keys(this.bitindex).length === 0) return 0;
        let binaryStr = "";
        const sortedKeys = Object.keys(this.bitindex)
            .map(k => parseInt(k, 10))
            .sort((a, b) => a - b);
        for (const key of sortedKeys) {
            if (isNaN(key)) continue;
            const { index, bitsize } = this.bitindex[key];
            let bin = index.toString(2).padStart(bitsize, "0");
            if (bin.length > bitsize) bin = bin.slice(-bitsize);
            binaryStr += bin;
        }
        return parseInt(binaryStr || "0", 2);
    }

    #timestampCode() {
        return Math.floor(this.createdAt.getTime());
    }


    #GenerateID4Order() {
        const productTypeNum = this.#productTypeCode();
        const timestampNum = this.#timestampCode();
        const hashStr = this.#generateRandomBlock(5);

        const productTypeStr = this.padSymbols(this.toSymbols(productTypeNum), 12);
        const timestampStr = this.padSymbols(this.toSymbols(timestampNum), 8);

        return [
            productTypeStr.slice(0, 5),
            productTypeStr.slice(5, 10),
            productTypeStr.slice(10, 12) + timestampStr.slice(0, 3),
            timestampStr.slice(3, 8),
            hashStr
        ].join('-');
    }

    rename(name) { this.name = name; }
    reassignID() { this.id = this.#GenerateID4Order(); }


    addOrUpdateFeature(key = null, value = null, bitorder = -1, index = 0, bitsize = 0) {
        this.setFeature(key, value);
        this.setBitorderForID(bitorder, index, bitsize);
    }

    setFeature(key, value) {
        if (key == null || value == null) return;

        if (Array.isArray(value)) return;

        if (typeof value === 'object' && value !== null) {
            if (!this.features[key]) this.features[key] = {};
            this.deepMerge(this.features[key], value);
        } else {
            this.features[key] = value;
        }
    }

    deepMerge(target, source) {
        for (const k in source) {
            if (
                source[k] &&
                typeof source[k] === 'object' &&
                !Array.isArray(source[k])
            ) {
                if (!target[k] || typeof target[k] !== 'object') {
                    target[k] = {};
                }
                this.deepMerge(target[k], source[k]);
            } else {
                target[k] = source[k];
            }
        }
        return target;
    }

    setBitorderForID(bitorder, index, bitsize) {
        if (bitorder < 0) return;
        this.bitindex[bitorder] = { index, bitsize };
    }

    removeFeature(key = null, value = null, bitorder = -1) {
        if (bitorder >= 0 && this.bitindex?.[bitorder] !== undefined) delete this.bitindex[bitorder];
        if (!key || this.features[key] === undefined) return;
        if (value === null) {
            delete this.features[key];
            return;
        }
        if (typeof value === "object" && !Array.isArray(value)) {
            this.features[key] = this.#deepRemove(this.features[key], value);
            if (this.#isEmpty(this.features[key])) {
                delete this.features[key];
            }
            return;
        }
    }

    #deepRemove(target, pattern) {
        if (!this.#isObject(target) || !this.#isObject(pattern)) return target;

        for (const key in pattern) {
            if (this.#isObject(target[key]) && this.#isObject(pattern[key])) {
                target[key] = this.#deepRemove(target[key], pattern[key]);
                if (this.#isEmpty(target[key])) {
                    delete target[key];
                }
            } else if (target[key] === pattern[key]) {
                delete target[key];
            }
        }
        return target;
    }

    #isObject(obj) {
        return obj && typeof obj === "object" && !Array.isArray(obj);
    }

    #isEmpty(obj) {
        return this.#isObject(obj) && Object.keys(obj).length === 0;
    }


    exportData() {
        this.#createNewProductId(EXPORTTYPE.Order);
        this.#storeDataLocally(this.#createProductData());
        this.#storeIdToOrderList();
    }

    #createNewProductId(exporttype) {
        switch (exporttype) {
            case EXPORTTYPE.Order:
                this.id = this.#GenerateID4Order();
                break;
            case EXPORTTYPE.Offer:
                this.id = this.#generateID4Offer();
                break;
            default:
                break;
        }
    }

    #generateID4Offer() {
        const productTypeNum = this.#productTypeCode();
        const productTypeStr = this.padSymbols(this.toSymbols(productTypeNum), 12);
        return [
            productTypeStr.slice(0, 5),
            productTypeStr.slice(5, 10),
            productTypeStr.slice(10, 12)].join('-');
    }

    #storeDataLocally(data) {
        localStorage.setItem(this.id, JSON.stringify(data));
    }

    #storeIdToOrderList() {
        const ids = new Set(JSON.parse(localStorage.getItem('orderList') || '[]'));
        ids.add(this.id);
        localStorage.setItem('orderList', JSON.stringify([...ids]));
    }

    async exportToOffer() {
        this.#createNewProductId(EXPORTTYPE.Offer);
        await this.#exportDataToOfferServer(this.#createProductData());
    }

    #createProductData() {
        return {
            id: this.id,
            name: this.name,
            bitindex: this.bitindex,
            createdAt: this.createdAt.toISOString(),
            features: { ...this.features },
        };
    }

    async #exportDataToOfferServer(data) {
        try {
            const res = await fetch(APICALL.STORE_2_OFFER, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.text();
                throw new Error(`Failed to export offer: ${res.status} — ${error}`);
            }
            console.log("✅ Offer exported successfully");
        } catch (err) {
            console.error("❌ Error during exportDataToOfferServer:", err);
        }
    }

    async removeProduct() {
        try {
            if (!this.id) throw new Error("Product ID is missing");

            // 1️⃣ Remove product from localStorage
            localStorage.removeItem(this.id);

            // 2️⃣ Remove product ID from the orderList
            const orderList = new Set(JSON.parse(localStorage.getItem('orderList') || '[]'));
            if (orderList.has(this.id)) {
                orderList.delete(this.id);
                localStorage.setItem('orderList', JSON.stringify([...orderList]));
            }

            console.log(`✅ Product with ID ${this.id} removed from localStorage and orderList`);
        } catch (err) {
            console.error("❌ Error during removeProduct:", err);
        }
    }


    async removeFromOffer(password) {
        try {
            const res = await fetch(APICALL.DELETE_OFFER, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: this.id,
                    password: password
                }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.success) {
                console.error("❌ Delete failed:", data);
                return false;
            }

            console.log(`✅ Offer ${this.id} deleted`);
            return true;

        } catch (err) {
            console.error("❌ Error during removeFromOffer:", err);
            return false;
        }
    }



    static async importAllFromServer() {
        try {
            const res = await fetch(APICALL.FETCH_ALL);

            if (!res.ok) {
                console.error("❌ Failed to fetch offers:", res.status);
                return [];
            }

            const payload = await res.json().catch(() => null);
            if (!payload) return [];

            // Handleren svarer med { success:true, data:[...] }
            const list = Array.isArray(payload) ? payload
                : Array.isArray(payload.data) ? payload.data
                    : [];

            return list
                .map(item => Product.importData(item))
                .filter(p => p !== null);

        } catch (err) {
            console.error("❌ Error during importAllFromServer:", err);
            return [];
        }
    }



    /** LocalStorage import */
    static importFromStorage(id) {
        try {
            const raw = localStorage.getItem(id);
            if (!raw) return null;
            return Product.importData(JSON.parse(raw));
        } catch {
            console.error('Failed to parse product', id);
            return null;
        }
    }

    static importAllFromStorage(list = "orderList") {
        const ids = JSON.parse(localStorage.getItem(list) || '[]');
        return ids.map(id => Product.importFromStorage(id)).filter(p => p !== null);
    }

    /** Common import */
    static importData(data) {
        const p = new Product(data.name || "");
        p.features = data.features || {};
        p.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        p.id = data.id || p.#GenerateID4Order();
        return p;
    }
}
