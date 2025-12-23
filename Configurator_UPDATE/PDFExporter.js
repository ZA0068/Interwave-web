import { fontData } from './DejaVuSans.js';
import { fontDataBold } from './DejaVuSans-Bold.js';
import { buttonColorMap, IMAGES } from "./api_container.js";

export class PDFExporter {

    constructor() {
        this.#loadPDF();
        this.#initializeVariables();
    }

    setup(product) {
        const features = product.features || {};

        this.id = product.id || "00000-00000-00000-00000-00000";
        this.idLabel = "ID:";
        this.label = undefined;

        this.robot = features.Robot;
        this.headers = features.Headers;
        this.tools = features.Tools;

        if (!this.Service) {
            throw new Error("Error, Subscription do not");
        }


        this.brand = this.robot.Features.Brand;
        this.branch = this.headers.Branch;
        this.branchLabel = "Branch";
        this.innovation_partner = this.headers["Innovation Partner"] || false;

        const defaultColor = { box: [255, 255, 255], text: [0, 0, 0] };
        this.branchColor = {
            box: buttonColorMap.background[this.branch] || defaultColor.box,
            text: buttonColorMap.text[this.branch] || defaultColor.text
        };

        this.hasRobot = this.headers.Robot;
        this.hasTools = this.headers.Tools;

        this.toolEntries = Object.entries(this.tools || {}).filter(([_, val]) => val != null && val !== '');


        if (this.hasRobot) {
            this.image_name = product.getImageKeyForRobot();
        } else if (this.hasTools) {
            this.image_name = "Tools";
        } else {
            this.image_name = undefined;
        }
    }


    setupWithOfferCard(card) {
        this.card = card;
        const product = card.product || {}; // fallback to empty object
        const features = product.features || {};

        this.id = product.id || "00000-00000-00000-00000-00000";
        this.idLabel = "ID:";
        this.label = undefined;

        this.robot = features.Robot;
        this.tools = features.Tools;
        this.Service = features.Service;

        if (!this.Service) {
            throw new Error("Error, Subscription do not");
        }


        this.brand = this.robot?.Brand || "unbranded";
        this.branch = features.Branch || "";
        this.branchLabel = "Branch";
        this.innovation_partner = features["Innovation-Partner"] || false;

        const defaultColor = { box: [255, 255, 255], text: [0, 0, 0] };
        this.branchColor = {
            box: buttonColorMap.background[this.branch] || defaultColor.box,
            text: buttonColorMap.text[this.branch] || defaultColor.text
        };

        this.hasRobot = features.Feature.Robot;
        this.hasTools = features.Feature.Tools;

        this.toolEntries = Object.entries(this.tools || {}).filter(([_, val]) => val != null && val !== '');


        if (this.hasRobot) {
            this.image_name = card.getImageKeyForRobot();
        } else if (this.hasTools) {
            this.image_name = "Tools";
        } else {
            this.image_name = undefined;
        }
    }


    #loadPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error("jsPDF not loaded!");
            return;
        }
        const { jsPDF } = window.jspdf;
        this.pdf = new jsPDF("p", "mm", "a4");
        this.#loadFonts();
    }

    #initializeVariables() {
        this.pageWidth = this.pdf.internal.pageSize.getWidth();
        this.pageHeight = this.pdf.internal.pageSize.getHeight();
        this.margin = 15;
        this.usableWidth = this.pageWidth - this.margin * 2;
        this.shallprintfeatures = true;
        this.fontSize = 10;
        this.lineHeight = 8;
        this.rowHeight = 8;
        this.sectionSpacing = 10;
        this.col1X = this.margin;
        this.col2X = this.pageWidth / 2;
        this.columnWidth = this.usableWidth / 2;
        this.isBranchCreated = false;
        this.boxHeight = 0;
        this.underlineY = this.margin + 2;
        this.yOffset = 0;
        this.isCustomerDefined = false;
        this.maxLogoWidth = this.pageWidth / 4;
        this.maxImageWidth = this.pageWidth / 2;
    }

    setCustomerInfo(customer_info = undefined) {
        if (!customer_info) return;

        const expectedKeys = [
            "name",
            "country",
            "phone_number",
            "email",
            "company",
            "CVR",
            "EAN",
            "reference",
            "position",
            "hectre",
            "loc_pr_hectre",
            "n_km_loc",
            "n_machinists",
            "n_gardeners",
            "machines",
            "tools"
        ];


        const actualKeys = Object.keys(customer_info).sort();
        const validKeys = [...expectedKeys].sort();

        const keysMatch =
            actualKeys.length === validKeys.length &&
            actualKeys.every((key, i) => key === validKeys[i]);

        if (!keysMatch) {
            throw new Error("Invalid customer_info: keys do not match expected structure.");
        }

        this.customer_info = customer_info;
        this.isCustomerDefined = true;
    }


    async build() {
        if (!this.hasRobot && !this.hasTools && this.shallprintfeatures) {
            this.#buildMinimalPage();
        } else {
            await this.#buildPage4Robot();
            await this.#buildPage4Tools();
            await this.#buildPage4Subscription();
        }
    }

    async print() {
        try {
            const defaultName = this.#buildDefaultFilename();
            const pdfBlob = this.pdf.output("blob");

            // 1) Save locally for the customer
            if ("showSaveFilePicker" in window) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: defaultName,
                        types: [{ description: "PDF file", accept: { "application/pdf": [".pdf"] } }],
                    });
                    const writable = await fileHandle.createWritable();
                    await writable.write(pdfBlob);
                    await writable.close();
                } catch (err) {
                    console.warn("Save dialog cancelled, falling back to download:", err);
                    this.pdf.save(defaultName);
                }
            } else {
                this.pdf.save(defaultName);
            }

            // 2) Send copy to sales@re-mac.com
            try {
                await this.#sendCopyToSales(defaultName);
                console.log("✅ PDF copy sent to sales@re-mac.com");
            } catch (err) {
                console.error("❌ Failed to send PDF to sales:", err);
            }
        } catch (err) {
            console.error("❌ PDF export error:", err);
        }
    }

    async #sendCopyToSales(filename = "export.pdf") {
        const endpoint = "/ExportPDF";
        const pdfBlob = this.pdf.output("blob");
        const file = new File([pdfBlob], filename, { type: "application/pdf" });

        const formData = new FormData();
        formData.append("subject", `Business case PDF - ${filename}`);

        // Hvis du har customer_info, så send den med som metadata
        if (this.customer_info) {
            if (this.customer_info.name) {
                formData.append("customer_name", this.customer_info.name);
            }
            if (this.customer_info.email) {
                formData.append("customer_email", this.customer_info.email);
            }
        }

        formData.append("attachment", file);

        const res = await fetch(endpoint, {
            method: "POST",
            body: formData,
            credentials: "same-origin",
        });

        if (!res.ok) {
            throw new Error(`send-pdf.php responded with HTTP ${res.status}`);
        }

        const data = await res.json().catch(() => null);
        if (!data || !data.success) {
            throw new Error(
                `send-pdf.php failed: ${data && data.error ? data.error : "UNKNOWN"}`
            );
        }
    }


    async #saveWithDialog() {
        try {
            const defaultName = this.#buildDefaultFilename();
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: defaultName,
                types: [
                    {
                        description: "PDF file",
                        accept: { "application/pdf": [".pdf"] },
                    },
                ],
            });

            const writable = await fileHandle.createWritable();
            const pdfData = this.pdf.output("blob");
            await writable.write(pdfData);
            await writable.close();

            console.log("✅ PDF saved via Save As dialog:", defaultName);
        } catch (err) {
            console.error("❌ Save failed:", err);
        }
    }


    async #buildPage4Robot() {
        if (!this.hasRobot) return;
        this.label = "Robot"
        this.shallprintfeatures = true;
        this.#printPageHeader();
        this.logoImageData = this.#scaleDimensions(IMAGES["Re-Bot-Logo"], this.maxLogoWidth);
        this.robotImageData = this.#scaleDimensions(IMAGES[this.image_name], this.maxImageWidth);

        await this.#drawImage(this.logoImageData, this.lineHeight / 2);
        await this.#drawImage(this.robotImageData);
        for (const key in this.robot) {
        this.#drawFeaturesHeader(key);
        this.#fillFeatureTable(this.robot[key]);
        }
    }

    async #buildPage4Tools() {
        if (!this.hasTools) return;
        this.label = "Tool";
        for (const key in this.tools) {
        this.shallprintfeatures = true;
        this.#initToolPageHeader();
        this.logoImageData = this.#scaleDimensions(IMAGES["Re-Dresser-Logo"], this.maxLogoWidth);
        this.toolImageData = this.#scaleDimensions(IMAGES[this.card.getImageKeyForTools("Re-Dresser")], this.maxImageWidth);

        await this.#drawImage(this.logoImageData, this.lineHeight / 2);
        await this.#drawImage(this.toolImageData);

        for (const subkey in this.tools[key]) {
            this.#drawFeaturesHeader();
            this.#fillFeatureTable4Tools();
        }
    }
    }

    async #buildPage4Subscription() {
        this.label = "Abonnoment";
        this.#startPage();
        this.#fillFeatureTable4Subscription();
    }


    #buildDefaultFilename() {
        return `${this.image_name}_${this.id}.pdf`;
    }


    #loadFonts() {
        this.pdf.addFileToVFS("DejaVuSans.ttf", fontData);
        this.pdf.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
        this.pdf.addFileToVFS("DejaVuSans-Bold.ttf", fontDataBold);
        this.pdf.addFont("DejaVuSans-Bold.ttf", "DejaVuSans", "bold");
        this.pdf.setFont("DejaVuSans");
    }



    #scaleDimensions(source, maxWidth) {
        if (!source || source.length < 3) return [null, 0, 0];
        const [src, trueW, trueH] = source;
        if (!src || trueW <= 0 || trueH <= 0) return [null, 0, 0];
        const aspectRatio = trueW / trueH;
        const scaledW = Math.min(maxWidth, trueW);
        const scaledH = scaledW / aspectRatio;
        return [src, scaledW, scaledH];
    };

    #addImage(imgSrc, x, w, h, format = "PNG") {
        return new Promise((resolve, reject) => {
            if (!imgSrc || w <= 0 || h <= 0) {
                return resolve(null); // skip invalid gracefully
            }
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => {
                try {
                    this.pdf.addImage(img, format, x, this.yOffset, w, h);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = (err) => reject(err);
            img.src = imgSrc;
        });
    }


    #printPageHeader() {
        this.pdf.setFontSize(this.fontSize + 2.5);
        this.pdf.setFont("DejaVuSans", "bold");
        this.pdf.text(this.label, this.margin, this.margin);

        const labelWidth = this.pdf.getTextWidth(this.idLabel + " ");
        const valueWidth = this.pdf.getTextWidth(this.id);
        const totalWidth = labelWidth + valueWidth;
        const endpointX = this.pageWidth - this.margin;
        const idX = endpointX - totalWidth + this.margin - 3;

        this.pdf.setFontSize(this.fontSize);

        // Draw bold label
        this.pdf.setFont("DejaVuSans", "bold");
        this.pdf.text(this.idLabel, idX, this.margin);

        // Draw normal value right after
        this.pdf.setFont("DejaVuSans", "normal");
        this.pdf.text(this.id, idX + labelWidth, this.margin);
        this.pdf.setLineWidth(0.5);
        this.pdf.line(this.margin, this.underlineY, endpointX, this.underlineY);
        this.#buildBranch();
        this.yOffset = this.underlineY / 2 + this.lineHeight + this.boxHeight;
        this.#buildCustomerInfo();
    };

    #buildBranch() {
        if (!this.branch || this.isBranchCreated) return;

        this.pdf.setFontSize(this.fontSize * 1.5);
        this.pdf.setFont("DejaVuSans", "bold");

        const boxY = this.underlineY + this.lineHeight;
        this.boxHeight = this.rowHeight * 1.1;
        this.pdf.setLineWidth(0.3);

        // --- LEFT HALF (Branch) ---
        const leftStartX = this.margin;
        const leftEndX = this.pageWidth / 2;
        const leftWidth = leftEndX - leftStartX;
        const col1Width = leftWidth / 2;
        const col2Width = leftWidth / 2;

        const col1X = leftStartX;
        const col2X = col1X + col1Width;

        // Draw col1 (label)
        this.pdf.setDrawColor(0);
        this.pdf.setFillColor(255, 255, 255);
        this.pdf.rect(col1X, boxY - this.rowHeight, col1Width, this.boxHeight, 'FD');

        // Draw col2 (value)
        this.pdf.setDrawColor(0);
        this.pdf.setFillColor(...this.branchColor.box);
        this.pdf.rect(col2X, boxY - this.rowHeight, col2Width, this.boxHeight, 'FD');
        this.pdf.setFillColor(255, 255, 255);

        // Center text in col1 and col2
        const labelWidth = this.pdf.getTextWidth(this.branchLabel);
        const valueWidth = this.pdf.getTextWidth(this.branch);
        const labelX = col1X + (col1Width - labelWidth) / 2;
        const valueX = col2X + (col2Width - valueWidth) / 2;

        this.pdf.text(this.branchLabel, labelX, boxY - 1.5);
        this.pdf.setTextColor(...this.branchColor.text);
        this.pdf.text(this.branch, valueX, boxY - 1.5);
        this.pdf.setTextColor(0);

        // --- RIGHT HALF (Innovation Partner) ---
        const rightStartX = this.pageWidth / 2;
        const rightEndX = this.pageWidth - this.margin;
        const rightWidth = rightEndX - rightStartX;

        // Measure title and mark
        const title = "Innovation Partner";
        const mark = this.innovation_partner ? "✔" : "✘";
        const titleWidth = this.pdf.getTextWidth(title);
        const markWidth = this.pdf.getTextWidth(mark);

        const padding = 6;
        const col3Width = titleWidth + padding * 2;
        const col4Width = rightWidth - col3Width;

        const col3X = rightStartX;
        const col4X = col3X + col3Width;

        // Draw col3 (title)
        this.pdf.setDrawColor(0);
        this.pdf.setFillColor(255, 255, 255);
        this.pdf.rect(col3X, boxY - this.rowHeight, col3Width, this.boxHeight, 'FD');

        // Draw col4 (mark)
        this.pdf.setDrawColor(0);
        this.pdf.setFillColor(240, 240, 240);
        this.pdf.rect(col4X, boxY - this.rowHeight, col4Width, this.boxHeight, 'FD');

        // Center text in col3 and col4
        const titleX = col3X + (col3Width - titleWidth) / 2;
        const markX = col4X + (col4Width - markWidth) / 2;

        this.pdf.text(title, titleX, boxY - 1.5);
        this.pdf.text(mark, markX, boxY - 1.5);

        // --- Finish ---
        this.yOffset += this.lineHeight * 1.5;
        this.isBranchCreated = true;
    }




    #buildCustomerInfo() {
        if (!this.isCustomerDefined || !this.customer_info) return;

        const group1 = {
            Name: this.customer_info.name,
            Country: this.customer_info.country,
            Phone: this.customer_info.phone_number,
            Email: this.customer_info.email,
            Company: this.customer_info.company,
            CVR: this.customer_info.CVR,
            EAN: this.customer_info.EAN,
            Reference: this.customer_info.reference,
            Position: this.customer_info.position,
            Machines: this.customer_info.machines, // array

        };

        const group2 = {
            Hectare: this.customer_info.hectre,
            "Location per Hectare": this.customer_info.loc_pr_hectre,
            "Km per Location": this.customer_info.n_km_loc,
            "Machine Operators": this.customer_info.n_machinists,
            Gardeners: this.customer_info.n_gardeners,
            Tools: this.customer_info.tools // array
        };

        const boxX = this.margin;
        const boxY = this.yOffset;
        const boxW = this.usableWidth;
        const lineH = this.lineHeight;
        const halfW = boxW / 2;

        // Centered title
        this.pdf.setFontSize(this.fontSize * 1.2);
        this.pdf.setFont("DejaVuSans", "bold");
        const title = "Customer Information";
        const titleWidth = this.pdf.getTextWidth(title);
        const titleX = boxX + (boxW - titleWidth) / 2;
        const titleY = boxY + lineH;
        this.pdf.text(title, titleX, titleY);

        const startY = boxY + lineH * 1.5;

        // Draw groups
        const group1Box = this.#drawCustomerTableGroup(group1, boxX, startY, halfW);
        const group2Box = this.#drawCustomerTableGroup(group2, boxX + halfW, startY, halfW);

        const maxHeight = Math.max(group1Box.height, group2Box.height);
        const fullBoxHeight = maxHeight + lineH * 1.5;

        // Draw outer box
        this.pdf.setDrawColor(0);
        this.pdf.setLineWidth(0.3);
        this.pdf.rect(boxX, boxY + 0.5, boxW, fullBoxHeight - 0.5);

        this.yOffset = boxY + fullBoxHeight + lineH;
        this.isCustomerDefined = false;
    }


    #drawCustomerTableGroup(entries, x, y, width) {
        const lineH = this.lineHeight;
        const padding = 4; // horizontal padding inside cells
        // initial column widths (fractional)
        let keyW = width * 0.35;
        let valW = width - keyW;

        const keyX = x;
        const valX = x + keyW;

        // config: maximum reasonable lines before we change layout
        const maxAllowedLines = 8;

        // First pass: compute wrapped lines for each entry given current widths
        const meta = []; // { key, valueStr, keyLines, valLines, maxLines, stacked:false }
        let largestLines = 0;

        for (const [key, value] of Object.entries(entries)) {
            // skip undefined/null (but allow zero)
            if (value === undefined || value === null) continue;

            // Build value string. Arrays => each item as its own line.
            let valueStr;
            if (Array.isArray(value)) {
                if (value.length === 0) continue;
                // join with newline so splitTextToSize sees separate lines
                valueStr = value.map(v => String(v)).join("\n");
            } else {
                valueStr = String(value);
            }

            // Compute wrapped key lines
            this.pdf.setFont("DejaVuSans", "bold");
            let keyLines = this.pdf.splitTextToSize(key + ":", Math.max(10, keyW - padding));

            // Compute wrapped value lines
            this.pdf.setFont("DejaVuSans", "normal");
            // splitTextToSize will respect existing newlines in valueStr
            let valLines = this.pdf.splitTextToSize(valueStr, Math.max(10, valW - padding));

            const maxLines = Math.max(keyLines.length, valLines.length);
            meta.push({ key, valueStr, keyLines, valLines, maxLines, stacked: false });

            if (maxLines > largestLines) largestLines = maxLines;
        }

        // If the largest required number of lines is too big, try rebalancing columns:
        if (largestLines > maxAllowedLines) {
            // give more space to value column (min key width 20%)
            const altKeyW = Math.max(width * 0.20, 40); // never super narrow; 40mm min
            const altValW = width - altKeyW;

            // Recompute wrapped lines using alternative widths
            largestLines = 0;
            for (const item of meta) {
                this.pdf.setFont("DejaVuSans", "bold");
                item.keyLines = this.pdf.splitTextToSize(item.key + ":", Math.max(10, altKeyW - padding));
                this.pdf.setFont("DejaVuSans", "normal");
                item.valLines = this.pdf.splitTextToSize(item.valueStr, Math.max(10, altValW - padding));
                item.maxLines = Math.max(item.keyLines.length, item.valLines.length);
                if (item.maxLines > largestLines) largestLines = item.maxLines;
            }

            // apply new widths if it helped
            if (largestLines <= Math.ceil(maxAllowedLines * 1.25)) {
                // adopt alt widths (if it improved)
                keyW = altKeyW;
                valW = altValW;
            } else {
                // otherwise mark entries that are excessively long to render stacked
                for (const item of meta) {
                    if (item.maxLines > maxAllowedLines) {
                        item.stacked = true;
                    }
                }
            }
        }

        // Now draw rows using final widths and stacked flags
        const startX = x;
        let currentY = y;

        // recalc X for value column based on final keyW
        const finalKeyX = startX;
        const finalValX = startX + keyW;

        for (const item of meta) {
            const { key, keyLines, valLines, stacked } = item;

            if (stacked) {
                // Draw key row (small row with key label across key column area)
                const keyHeight = Math.max(lineH, keyLines.length * lineH);
                this.pdf.setDrawColor(0);
                this.pdf.setLineWidth(0.3);
                this.pdf.rect(finalKeyX, currentY, width, keyHeight); // full width box for key
                // draw key text (bold), left padded
                this.pdf.setFont("DejaVuSans", "bold");
                let ky = currentY + lineH;
                for (const line of keyLines) {
                    this.pdf.text(line, finalKeyX + 2, ky - 2.5);
                    ky += lineH;
                }
                currentY += keyHeight;

                // Draw value row beneath spanning the full width
                const wrappedValLines = this.pdf.splitTextToSize(item.valueStr, Math.max(10, width - padding));
                const valHeight = wrappedValLines.length * lineH;
                this.pdf.setDrawColor(0);
                this.pdf.setLineWidth(0.3);
                this.pdf.rect(finalKeyX, currentY, width, valHeight);
                this.pdf.setFont("DejaVuSans", "normal");
                let vy = currentY + lineH;
                for (const line of wrappedValLines) {
                    this.pdf.text(line, finalKeyX + 2, vy - 2.5);
                    vy += lineH;
                }
                currentY += valHeight;
            } else {
                // normal two-column row
                const lines = Math.max(keyLines.length, valLines.length);
                const rowHeight = lines * lineH;

                // draw borders for key and value cells
                this.pdf.setDrawColor(0);
                this.pdf.setLineWidth(0.3);
                this.pdf.rect(finalKeyX, currentY, keyW, rowHeight);
                this.pdf.rect(finalValX, currentY, valW, rowHeight);

                // draw key (bold)
                this.pdf.setFont("DejaVuSans", "bold");
                let ky = currentY + lineH;
                for (const line of keyLines) {
                    this.pdf.text(line, finalKeyX + 2, ky - 2.5);
                    ky += lineH;
                }

                // draw value
                this.pdf.setFont("DejaVuSans", "normal");
                let vy = currentY + lineH;
                for (const line of valLines) {
                    this.pdf.text(line, finalValX + 2, vy - 2.5);
                    vy += lineH;
                }

                currentY += rowHeight;
            }

            // small gap between rows (optional)
            // currentY += 1;
        }

        const boxHeight = currentY - y;
        return { height: boxHeight };
    }



    #startPage() {
        this.pdf.addPage();
        this.#printPageHeader();
        this.yOffset = this.margin + this.lineHeight * 1.2;
    };

    #drawRowBorders() {
        this.pdf.setDrawColor(180);
        this.pdf.setLineWidth(0.2); // thinner than before
        this.pdf.rect(this.col1X, this.yOffset - this.rowHeight + 2, this.columnWidth, this.rowHeight);
        this.pdf.rect(this.col2X, this.yOffset - this.rowHeight + 2, this.columnWidth, this.rowHeight);
    };

    #drawFeaturesHeader(heading = "Features") {
        if (!this.shallprintfeatures) return;
        this.pdf.setFontSize(10);
        this.pdf.setDrawColor(180);
        this.pdf.setFont("DejaVuSans", "bold");
        this.pdf.text(heading, this.margin, this.yOffset);
        this.pdf.line(this.margin, this.yOffset + 1, this.pageWidth - this.margin, this.yOffset + 1);
        this.shallprintfeatures = false;
        this.yOffset += this.sectionSpacing;
    };

    #writeRightTableElement(text) {
        const t = String(text)
            .replace(/✔/g, "\u2714")
            .replace(/✘/g, "\u2718")
            .replace(/[^\u0020-\u007E\u2714\u2718]/g, "");
        this.pdf.setFontSize(this.fontSize);
        this.pdf.setFont("DejaVuSans", "normal");
        const w = this.pdf.getTextWidth(t);
        const x = this.col2X + (this.columnWidth - w) / 2;
        this.pdf.text(t, x, this.yOffset - 0.5);
    };

    #writeLeftTableElement(text) {
        this.pdf.setFontSize(this.fontSize);
        this.pdf.setFont("DejaVuSans", "bold");
        this.pdf.text(text, this.col1X + 2, this.yOffset - 0.5);
    };

    #needsNewPage() {
        return this.yOffset + this.rowHeight > this.pageHeight - this.margin;
    }

    #fillFeatureTable4Tools() {
        for (const [toolName, obj] of this.toolEntries) {
            this.pdf.setFontSize(this.fontSize);
            this.pdf.setFont("DejaVuSans", "bold");
            this.#checkIfNewPageIsNeeded();
            this.#fillSpecArray(obj);
            this.yOffset += this.sectionSpacing;
        }
    }

    #fillFeatureTable4Subscription() {
        for (const obj of Object.entries(this.Service)) {
            this.shallprintfeatures = true;
            this.#drawFeaturesHeader(obj[0]);
            this.pdf.setFontSize(this.fontSize);
            this.pdf.setFont("DejaVuSans", "bold");
            this.#checkIfNewPageIsNeeded();
            this.#fillSpecArray(obj[1]);
            this.yOffset += this.sectionSpacing;
        }
    }

    #fillSpecArray(obj) {
        for (const [left, right] of Object.entries(obj)) {
            this.#buildTable(left, right);
        }
    }

    #buildTable(left, right) {
        this.#checkIfNewPageIsNeeded();
        this.#drawRowBorders();
        this.#writeLeftTableElement(left);
        this.#writeRightTableElement(right);
        this.yOffset += this.rowHeight;
    }

    #buildMinimalPage() {
        this.#printPageHeader("Robot");
        this.pdf.setFontSize(10);
        this.pdf.setFont("DejaVuSans", "bold");
        this.pdf.text("Features", this.margin, this.margin + this.lineHeight * 2);
    }


    async #drawImage(imageData, spacing = this.lineHeight) {
        if (imageData?.[0]) {
            const imageX = (this.pageWidth - imageData[1]) / 2;
            await this.#addImage(imageData[0], imageX, imageData[1], imageData[2]);
            this.yOffset += imageData[2] + spacing;
        }
    }


    #fillFeatureTable(mainObj) {
        for (const key in mainObj) {
            const left = key;
            const right = mainObj[key];
            this.#checkIfNewPageIsNeeded("Robot");
            this.#drawRowBorders();
            this.#writeLeftTableElement(left);
            this.#writeRightTableElement(right);
            this.yOffset += this.rowHeight;
        }
    }


    #checkIfNewPageIsNeeded() {
        if (this.#needsNewPage()) {
            this.#startPage();
            this.#drawFeaturesHeader();
        }
    }

    #initToolPageHeader() {
        this.hasRobot ? this.#startPage() : this.#printPageHeader();
    }
}