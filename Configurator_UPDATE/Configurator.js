import { Product } from "/js/contents/Configurator/Product.js";
import { ContactForm } from "/js/contents/Configurator/ContactForm.js";
import { APICALL, findNearestRAL, EXPORTTYPE } from "/js/components/api_container.js";

export class Configurator {

    static makeEnum(arr) {
        return Object.freeze(
            arr.reduce((obj, key) => {
                obj[key] = key;
                return obj;
            }, {})
        );
    }

    static STEP_IDS = [
        "step-0",
        "step-1",
        "step-2",
        "step-3",
        "step-4",
        "step-5",
        "step-6",
        "step-7",
        "step-8",
        "step-9",
        "step-10",
        "step-11",
    ];

    static TYRE_MAP = {
        "GROUND-KARE-600": "GROUND-KARE",
        "GROUND-KARE-710": "GROUND-KARE",
        "GROUND-KING-420": "GROUND-KING",
        "GROUND-KING-600": "GROUND-KING",
        "TRACTOR-KING-480": "TRACTOR-KING",
        "TRACTOR-KING-600": "TRACTOR-KING",
        "COUNTRY-KING-560": "COUNTRY-KING",
        "COUNTRY-KING-710": "COUNTRY-KING",
        "TR-FOREST-2-480": "TR-FOREST-2",
        "TR-FOREST-2-600": "TR-FOREST-2",
    };

    static POWER_UNIT = {
        0: "Powerbank",
        1: "HVO100"
    };

    // === Derived enums ===
    static ConfigSteps = Configurator.makeEnum(Configurator.STEP_IDS);

    constructor() {
        this.#setupContainers();
        this.#setupSteps();
        this.#setupKeys();
        this.#setupFunctionHandlers();
        this.#initialize();
        this.#initfeatures();
        this.orderTabs = [];
    }


    async #loadHTMLTable(path) {
        if (this._cache?.[path]) return this._cache[path];
        const response = await fetch(path);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        const table = doc.querySelector("table");
        this._cache ??= {};
        this._cache[path] = table;
        return table;
    }

    #setupContainers() {
        this.container = document.querySelector(".configurator-container");
        if (!this.container) throw new Error("Container '.configurator-container' is NOT FOUND! Initialization aborted.");
        this.image_panel_hero_container = this.container.querySelector('.image-panel-hero-container');
        this.image_panel_carrusel_container = this.container.querySelector('.image-panel-carrusel-container');
    }

    #setupSteps() {
        this.steps = Configurator.STEP_IDS.reduce((map, id) => {
            map[id] = this.container.querySelector(`#${id}`);
            ;
            return map;
        }, {});
    }

    #setupKeys() {
        const rawBitConfig = {
            "Brand": [0, 1],
            "Model": [0, 2],
            "Branch": [0, 3],
            "Branch-Variants": [0, 1],
            "Configuration-Scope": [0, 2],
            "Color": [0, 3],
            "Module": [0, 1],
            "Linkage": [0, 2],
            "Battery-Capacity": [0, 1],
            "Power-Capacity": [0, 1],
            "Flex-Drive": [0, 1],
            "Track-Based": [0, 4],
            "Power-Unit": [0, 1],
            "Power-Unit-Type": [0, 1],
            "Draw-Bar": [0, 1],
            "Draw-Bar-Control": [0, 1],
            "Tool-LiftAlign": [0, 1],
            "Tool-Bridge": [0, 1],
            "Tool-Procision": [0, 1],
            "Drive-Cab": [0, 1],
            "Bulk-Dump": [0, 2],
            "Bulk-Agro": [0, 2],
            "Beach-Cleaner": [0, 2],
            "Cargo-Load": [0, 2],
            "Re-Dresser": [0, 1],
            "Re-Dresser-Variants": [0, 1],
            "Re-Dresser-Color": [0, 2],
            "Re-Dresser-Properties": [0, 2],
            "Re-Dresser-Properties-Basis": [0, 11],
            "Re-Dresser-Properties-Standard": [1, 12],
            "Re-Dresser-Properties-Excellent": [1, 1],
            "Acquire": [0, 2],
            "Innovation-Partner": [0, 2],
            "Subscription": [0, 2],
            "Software": [0, 1],
            "Service": [0, 2],
            "Operational-Administrator": [0, 12],
            "On-Site-Operators": [0, 12],
            "Re-Bot-UGV": [0, 12],
            "Sky-Vision-UAV": [0, 12],
            "Software-Drive-Cab": [0, 1],
            "Sky-Vision": [0, 1],
            "Vision-Based": [0, 2],
            "Vision-Based-Basis": [0, 23],
            "Vision-Based-Standard": [1, 22],
            "Vision-Based-Excellent": [1, 0],
            "Subscription-Re-Dresser": [0, 1],
            "Vision-Based-Re-Dresser": [0, 2],
            "Vision-Based-Re-Dresser-Properties-Basis": [0, 1],
            "Vision-Based-Re-Dresser-Properties-Standard": [1, 2],
            "Vision-Based-Re-Dresser-Properties-Excellent": [1, 0],
            "Tool-Control": [0, 2],
            "Tool-Control-Variant-Basis": [0, 0],
            "Tool-Control-Variant-Standard": [1, 1],
            "Tool-Control-Variant-Excellent": [1, 0],
        };

        this.bitindexes = {};
        let counter = 0;

        for (const [key, [flag, size]] of Object.entries(rawBitConfig)) {
            this.bitindexes[key] = [counter, size];
            if (flag === 0) {
                counter += 1;
            } else {
                this.bitindexes[key] = [counter - 1, size];
            }
        }
    }

    #setupFunctionHandlers() {
        this.handler_by_index = [
            this.handleStep0,
            this.handleStep1,
            this.handleStep2,
            this.handleStep3,
            this.handleStep4,
            this.handleStep5,
            this.handleStep6,
            this.handleStep7,
            this.handleStep8,
            this.handleStep9,
            this.handleStep10,
            this.handleStep11,
        ];
    }

    async #initialize() {
        this.pop_up_handled = false;
        this.ReDresserSpecArray = [];
        this.ToolServiceSpecArray = [];
        this.expose_all = false;
        this.show_Tools_Only = false;
        this.current_state_index = 0;
        this.maxIndex = Configurator.STEP_IDS.length - 1;
        this.saved_wheel = [null, null];
        this.selectors = {
            Model: [null, 0],
            "Configuration-Scope": ["Basis", 0],
            "Battery-Capacity": ["Basis", 0],
            "Power-Capacity": ["250kW", 0],
            "Color": [null, 0],
            Linkage: ["Single", 0],
            "Tyre-Types": [null, 0],
            "Track-Types": [null, 0],
            Module: [null, 0],
            "Power-Unit": [null, 0],
            "Power-Unit-Type": ["Powerbank", 0],
            "Draw-Bar": [null, 0],
            "Draw-Bar-Control": ["Passive-Steering", 0],
            "Flex-Drive": ["✘", 0],
            "Tool-LiftAlign": [null, 0],
            "Tool-Procision": [null, 0],
            "Tool-Bridge": [null, 0],
            "Drive-Cab": [null, 0],
            Branch: [null, 0],
            "Branch-Variants": [null, 0],
            "Bulk-Dump": [null, 0],
            "Bulk-Dump-Variants": ["Bulk-Dump-10", 0],
            "Bulk-Agro": [null, 0],
            "Bulk-Agro-Variants": ["Bulk-Agro-10", 0],
            "Beach-Cleaner": [null, 0],
            "Beach-Cleaner-Variants": ["Beach-Cleaner-2.5", 0],
            "Cargo-Load": [null, 0],
            "Cargo-Load-Variants": ["Cargo-Load-6", 0],
            "Re-Dresser": [null, 0],
            "Re-Dresser-Variants": ["Re-Dresser-2.5", 0],
            "Re-Dresser-Color": [null, 0],
            "Re-Dresser-Properties": ["Basis", 0, 0],
            "Vision-Based": ["Basis", 1, 0],
            "Sky-Vision": [null, 0],
            "Vision-Based-Re-Dresser": ["Basis", 1],
            "Vision-Based-Re-Dresser-Properties": [null, 0],
            "Subscription-Re-Dresser": [null, 0],
            "Subscription": [false, false],
            Software: [0, 0, false, false, false],
            Service: ["Bronze", 0],
            "Operational-Administrator": 0,
            "On-Site-Operators": 0,
            "Re-Bot-UGV": 0,
            "Sky-Vision-UAV": 0,
            "Software-Re-Dresser": [null, 1],
            "Service-Re-Dresser": [null, 2],
            Acquire: [null, 0],
            "Innovation-Partner": ["✔", 1],
            "Tool-Control": ["Basis", 1],
            "Tool-Control-Variant": [null, 0],
            "Draw-Bar-Re-Dresser": ["✘", null],
            "Re-Axle-Re-Dresser": ["✘", null],
        };

        this._programmaticClickDepth = 0;
        this.button_index = 0;
        this.re_dresser_table = this.#loadHTMLTable("/html/contents/Configurator/configurator-body-container/configuration-panel-container/Tables/Re-Dresser-Table.html");
        this.vision_based_re_dresser_table = this.#loadHTMLTable("/html/contents/Configurator/configurator-body-container/configuration-panel-container/Tables/Vision-Based-Re-Dresser-Table.html");
        this.tool_control_table = this.#loadHTMLTable("/html/contents/Configurator/configurator-body-container/configuration-panel-container/Tables/Tools-Control-Table.html");
        this.#initCarousels();
        this.contactform = new ContactForm;
        this.contactform.init();
    }


    #initfeatures() {
        this.product = new Product();
        this.setProductRobot({ "Features": { "Brand": "Re-Bot" } }, 0, "Brand");
        this.setProductRobot({ "Equipment": { "Flex-Drive™ (CTI)": "✘" } }, 0, "Flex-Drive");
        this.setProductRobot({ "Equipment": { "Ground contact": "Tyres" } }, 0, "Track-Based");
        this.setProductRobot({ "Accessories": { "Tool-LiftAlign™": "✘" } }, 0, "Tool-LiftAlign");
        this.setProductRobot({ "Accessories": { "Tool-Procision™": "✘" } }, 0, "Tool-Procision");
        this.setProductRobot({ "Accessories": { "Tool-Bridge™": "✘" } }, 0, "Tool-Bridge");
        this.setProductHeader({ "Innovation Partner": true }, 1);
        this.setProductHeader({ "Robot": false }, 0);
        this.setProductHeader({ "Acquire": null }, 0);
        this.setProductHeader({ "Tools": { "Bulk-Dump": false } }, 0);
        this.setProductHeader({ "Tools": { "Bulk-Agro": false } }, 0);
        this.setProductHeader({ "Tools": { "Cargo-Load": false } }, 0);
        this.setProductHeader({ "Tools": { "Beach-Cleaner": false } }, 0);
        this.setProductHeader({ "Tools": { "Re-Dresser": false } }, 0);
    }

    get notEventBasedButton() {
        return this._programmaticClickDepth > 0;
    }

    setProduct(key, value, bitorder, bitindex, bitsize) {
        this.product.addOrUpdateFeature(key, value, bitorder, bitindex, bitsize);
    }

    setProductBitValue(bitorder, bitindex, bitsize) {
        this.product.addOrUpdateFeature(null, null, bitorder, bitindex, bitsize);
    }

    setProductHeader(feature_key, feature_value) {
        this.setProduct("Header", feature_key, null, feature_value, null);
    }

    setProductHeaderWiithBitIndex(feature_key, feature_value, bit_index_key) {
        this.setProduct("Header", feature_key, this.bitindexes[bit_index_key][0], feature_value, this.bitindexes[bit_index_key][1]);
    }

    setProductRobot(feature_key, feature_value, bit_index_key) {
        this.setProduct("Robot", feature_key, this.bitindexes[bit_index_key][0], feature_value, this.bitindexes[bit_index_key][1]);
    }

    setProductRobotFeatures(feature_key, selector_key, bit_index_key) {
        this.setProductRobot({ "Features": { [feature_key]: this.selectors[selector_key][0] } }, this.selectors[selector_key][1], [bit_index_key]);
    }

    setProductRobotEquipment(feature_key, selector_key, bit_index_key) {
        this.setProductRobot({ "Equipment": { [feature_key]: this.selectors[selector_key][0] } }, this.selectors[selector_key][1], [bit_index_key]);
    }

    setProductRobotExtraEquipment(feature_key, selector_key, bit_index_key) {
        this.setProductRobot({ "Extra equipment": { [feature_key]: this.selectors[selector_key][0] } }, this.selectors[selector_key][1], [bit_index_key]);
    }

    setProductRobotAccessories(feature_key, selector_key, bit_index_key) {
        this.setProductRobot({ "Accessories": { [feature_key]: this.selectors[selector_key][0] } }, this.selectors[selector_key][1], [bit_index_key]);
    }

    setProductRobotSubscription(feature_key, feature_value, bit_index_key) {
        this.setProductRobot({ "Subscription": feature_key }, feature_value, bit_index_key);
    }

    setProductTools(feature_key, feature_value, bit_index_key) {
        this.setProduct("Tools", feature_key, this.bitindexes[bit_index_key][0], feature_value, this.bitindexes[bit_index_key][1]);
    }

    setProductToolFeatures(tool_header, feature_key, selector_key, bit_index_key) {
        this.setProductTools({ [tool_header]: { "Features": { [feature_key]: this.selectors[selector_key][0] } } }, this.selectors[selector_key][1], [bit_index_key]);
    }

    removeProductFeature(key = null, item = null, keyorder = -1) {
        this.product.removeFeature(key, item, keyorder);
    }

    removeProductFeatureRobot(feature) {
        this.removeProductFeature("Robot", feature, this.bitindexes[feature][0])
    }

    removeProductFeatureTools(feature) {
        this.removeProductFeature("Tools", feature, this.bitindexes[feature][0])
    }

    #renameProduct(name) {
        this.product.rename(name);
    }

    run() {
        this.container.addEventListener("click", e => this.#onClick(e));
    }

    #onClick(e) {
        this.#setIndex(e);
        this.#chooseCurrentHandler();
    }

    #chooseCurrentHandler() {
        if (this.current_state_index === -1) return;
        this.handler_by_index[this.current_state_index]?.call(this);
    }


    #setIndex(e) {
        this.event = e;
        this.cell = this.event.target.closest('[data-button]');

        if (!this.cell || !this.container) {
            this.current_state_index = -1;
            return;
        }

        const parent = this.cell.parentElement;

        const siblings = Array.from(parent.children).filter(
            child => child.hasAttribute('data-button')
        );

        this.button_index = siblings.indexOf(this.cell);

        this.current_step = this.cell.closest("[id^='step-']");
        if (!this.current_step) {
            this.current_state_index = -1;
            return;
        }

        this.current_state_index = Configurator.STEP_IDS.indexOf(this.current_step.id);
        if (this.current_state_index < 0) return;

        this.data_button = this.cell.dataset.button;
        this.sub_panel = this.cell.closest(".sub-panel");
        this.selection_panel = this.cell.closest(".selection-panel");
    }


    handleStep0() {
        switch (this.data_button) {
            case "Ideal":
            case "Essential":
            case "Premium":
                this.handleRobotStep0();
                break;
            case "Only-Tools":
                this.#handleOnlyTools();
                break;
            case "Program":
                this.#handleProgramStep0();
                break;
            default:
                break;
        }
        this.#unlockStep(1);
    }



    handleRobotStep0() {
        this.show_Tools_Only = false;
        this.#lockPanel('selection-panel', 'Tools', 'step-10');
        this.#deactivateAnyButton("Only-Tools", null);
        this.#toggleExclusive();
        this.setSelectors("Model", this.data_button, this.button_index + 1);
        this.#showSelectedImage("Robot");
        this.#showSelectedImageText("Robot", "Robot");
        this.setProductRobotFeatures("Model", "Model", "Model");
        this.#clickAnyButton(this.selectors.Model[0], "Model", "step-3");
        this.#lockStep(8);
        if (this.contactform && typeof this.contactform.setRobotValue === "function") {
            const robotLabel = `Re-Bot ${this.selectors.Model[0]}`;
            this.contactform.setRobotValue(robotLabel);
        }
    }

    #handleOnlyTools() {
        this.show_Tools_Only = true;
        this.removeProductFeatureRobot("Model");
        this.setSelectors("Model", null, 0);
        this.setProductHeader({ Robot: false }, 0);
        this.#activateAnyButton("Only-Tools", null);
        this.#deactivateAnyButton('Premium', null);
        this.#deactivateAnyButton('Essential', null);
        this.#deactivateAnyButton('Ideal', null);
        this.#showSelectedImage();
        this.#unlockStep(8);
        this.#lockPanel('selection-panel', 'Robot', 'step-10');
        this.#unlockPanel('selection-panel', 'Tools', 'step-10');

        // --- NYT: ryd Robot-værdien når der kun vælges tools ---
        if (this.contactform && typeof this.contactform.setRobotValue === "function") {
            this.contactform.setRobotValue("");
        }
    }

    #handleProgramStep0() {
        this.setSelectors("Type", null, 0);
        this.setProductHeader({ Robot: false }, 0);
        this.#activateAnyButton("Program", null);
        this.#deactivateAnyButton('Premium', null);
        this.#deactivateAnyButton('Essential', null);
        this.#deactivateAnyButton('Ideal', null);
        this.#showSelectedImage();
        this.#unlockProgram();
    }

    #unlockProgram() {
        this.#unlockStep(10);
        this.#unlockPanel('selection-panel', 'Robot', 'step-10');
        this.#unlockPanel('sub-panel', 'Subscription', 'step-10');
        this.#clickAnyButton("Software", "Subscription", "step-10");
        this.#unlockPanel('selection-panel', 'Tools', 'step-10');
        this.#unlockPanel('sub-panel', 'Subscription-Tools', 'step-10');
        this.#clickAnyButton("Software", "Subscription-Tools", "step-10");
    }

    handleStep1() {
        this.setSelectors("Login");
        switch (this.data_button) {
            case 'Login':
                this.#handleLogin();
                break;
            case 'NoLogin':
                this.#handleVisitor()
                break;
            default:
                break;
        }
    }

    async #handleVisitor() {
        this.cell.closest(".login-button").classList.add("active");
        try {
            await this.contactform.formComplete(['Visitor']);
        } catch (err) {
            console.error("Error during visitor login", err);
        } finally {
            this.pop_up_handled = true;
            this.#hideHeaderContainer();
            this.#unlockStep(2);
            this.#showBodyContainer();

        }
    }

    async #handleLogin() {
        this.cell.closest(".login-button").classList.add("active");
        try {
            await this.contactform.formComplete(['Customer']);
        } catch (err) {
            console.error("Error during visitor login", err);
        } finally {
            this.pop_up_handled = true;
            this.#hideHeaderContainer();
            this.#unlockStep(2);
            this.#showBodyContainer();
        }
    }

    handleStep2() {
        switch (this.data_button) {
            case "Agro":
                this.#handleAgro();
                break;
            case "Entrepeneur":
                this.#handleEntrepeneur();
                break;
            case "Sport":
                this.#handleSport();
                break;
            case "Airport":
                this.#handleAirport();
                break;
            case "Defence":
                this.#handleDefence();
                break;
            case "NGO":
                this.#handleNGO();
                break;
            case "All":
                this.handleUnlockAllButton();
                break;
            default:
                break;
        }
    }


    handleStep3() {
        switch (this.sub_panel.id) {
            case "Model":
                this.#handleRobot();
                this.#updateModuleHeader();
                break;
            default:
                break;
        }
        if (!this.notEventBasedButton) this.#unlockStep(4);
    }

    #handleConfigurationScope() {
        switch (this.data_button) {
            case "Basis":
            case "Standard":
                this.#selectExclusive();
                this.setSelectors("Configuration-Scope");
                this.setProductRobotFeatures("Configuration scope", "Configuration-Scope", "Configuration-Scope");
                this.#handleTableCols(this.sub_panel.id);
                break;
            case "Excellent":
                this.#activateAnyButton("CTI", 'Flex-Drive', 'step-6');
                this.#selectExclusive();
                this.setSelectors("Configuration-Scope");
                this.setProductRobotFeatures("Configuration scope", "Configuration-Scope", "Configuration-Scope");
                this.#handleTableCols(this.sub_panel.id);
                break;
            default:
                break;
        }
        if (this.cell.classList.contains("open-close-button")) {
            this.#handlePopupTable();
        }
    }

    handleStep4() {
        switch (this.sub_panel.id) {
            case "Branch-Variants":
                this.#handleBranchVariants();
                break;
            case "Color":
                this.#handleColorVariants();
                break;
            case "Module":
                this.#handleModule();
                break;
            case "Linkage":
                this.#handleLinkage();
                this.#unlockImageCarrusel();
                break;
            default:
                break;
        }
        if (!this.notEventBasedButton) {
            this.#unlockStep(5);
            this.#unlockStep(6);
        }
    }

    handleStep5() {
        switch (this.sub_panel.id) {
            case "Configuration-Scope":
                this.#handleConfigurationScope();
                break;
            case "Battery-Capacity":
                this.#handleBatteryCapacity();
                break;
            case "Power-Capacity":
                this.#handlePowerCapacity();
                break;
            default:
                break;
        }
        if (!this.notEventBasedButton) this.#unlockStep(6);
    }

    handleStep6() {
        switch (this.sub_panel.id) {
            case "Flex-Drive":
                this.#handleFlexDrive();
                break;
            case "Track-Based":
                this.#handleTrackBased();
                break;
            case "Tyre-Types":
                this.#handleTyreTypes();
                break;
            case "Track-Types":
                this.#handleTrackTypes();
                break;
            case "Power-Unit":
                this.#handlePowerUnit();
                break;
            case "Power-Unit-Type":
                this.#handlePowerUnitType();
                break;
            case "Draw-Bar":
                this.#handleDrawBar();
                break;
            case "Draw-Bar-Control":
                this.#handleDrawBarControl();
                break;
            default:
                break;
        }
        if (!this.notEventBasedButton) {
            this.show_Tools_Only = false;
            this.#unlockStep(7);
        }
    }

    handleStep7() {
        switch (this.sub_panel.id) {
            case "Tool-LiftAlign":
                this.#handleToolLiftAlign();
                break;
            case "Tool-Procision":
                this.#handleToolProcision();
                break;
            case "Tool-Bridge":
                this.#handleToolBridge();
                break;
            case "Drive-Cab":
                this.#handleDriveCab();
                break;
            default:
                break;
        }
        if (!this.notEventBasedButton) {
            this.#unlockStep(8);
        }
    }

    #handleInnoPartner() {
        if (this.data_button === "Innovation-Partner") {
            this.#toggleSelector("Innovation-Partner");
            this.cell.classList.toggle("selected", this.selectors["Innovation-Partner"][1]);
            this.setProductHeaderWiithBitIndex({ "Innovation Partner": this.selectors["Innovation-Partner"][0] }, this.selectors["Innovation-Partner"][1], "Innovation-Partner");
        }
        if (this.cell.classList.contains("open-close-button")) {
            this.#handlePopupTable();
        }
    }

    #handleAcquire() {
        this.#selectExclusive();
        this.#updateInfoText();
        this.setSelectors("Acquire");
        this.setProductHeaderWiithBitIndex({ "Purchase method": this.selectors.Acquire[0] }, this.selectors.Acquire[1], "Acquire");
        switch (this.data_button) {
            case 'Buy':
                this.#hideAnyButton('Platinum', 'Subscription-Class-Re-Dresser', 'step-10');
                this.#showAnyButton('Silver', 'Subscription-Class-Re-Dresser', 'step-10');
                break;
            case 'Rent':
                this.#showAnyButton('Platinum', 'Subscription-Class-Re-Dresser', 'step-10');
                this.#hideAnyButton('Silver', 'Subscription-Class-Re-Dresser', 'step-10');
                break;
            default:
                break;
        }
    }

    handleStep8() {
        switch (this.sub_panel.id) {
            case "Bulk-Dump":
                this.#handleBulkDump();
                break;
            case "Bulk-Dump-Variants":
                this.#handleBulkDumpVariants();
                break;
            case "Bulk-Agro":
                this.#handleBulkAgro();
                break;
            case "Bulk-Agro-Variants":
                this.#handleBulkAgroVariants();
                break;
            case "Beach-Cleaner":
                this.#handleBeachCleaner();
                break;
            case "Beach-Cleaner-Variants":
                this.#handleBeachCleanerVariants();
                break;
            case "Cargo-Load":
                this.#handleCargoLoad();
                break;
            case "Cargo-Load-Variants":
                this.#handleCargoLoadVariants();
                break;
            case "Re-Dresser":
                this.#handleReDresser();
                break;
            case "Re-Dresser-Variants":
                this.#handleReDresserType();
                break;
            case "Re-Dresser-Color":
                this.#handleReDresserColor();
                break;
            case "Re-Dresser-Properties":
                this.#handleReDresserProperties();
                break;
            default:
                break;
        }
        this.#unlockStep(9);
    }

    #handleSubscriptionClassReDresser() {
        this.#selectExclusive();
        this.#updateInfoText();
        this.setSelectors("Subscription-Re-Dresser");
        // this.setProduct("Service", { "Re-Dresser": { "Technical service": this.selectors["Subscription-Re-Dresser"][0] } }, this.bitindexes["Subscription-Re-Dresser"][0], this.selectors["Subscription-Re-Dresser"][1], this.bitindexes["Subscription-Re-Dresser"][1]);
        this.setProduct("Tool: Re-Dresser™", { "Subscription": { "Re-Dresser": { "Technical service": this.selectors["Subscription-Re-Dresser"][0] } } }, this.bitindexes["Subscription-Re-Dresser"][0], this.selectors["Subscription-Re-Dresser"][1], this.bitindexes["Subscription-Re-Dresser"][1]);
    }

    #handleSubscriptionClass() {
        this.setSelectors("Service");
        this.#selectExclusive();
        this.#updateInfoText();
        this.setProductRobotSubscription("Service", "Service", "Service")
        // this.setProduct("Service", { "Re-Bot": { Subscription: this.data_button } }, this.bitindexes["Service"][0], this.button_index, this.bitindexes["Service"][1]);
    }

    #handleVisionBasedReDresserVariant() {
        this.setSelectors("Vision-Based-Re-Dresser", this.data_button, this.button_index + 1);
        this.#selectExclusive();
        this.#updateInfoText();
        this.#handleTableCols(this.sub_panel.id);
        this.setProduct("Tool: Re-Dresser™", { "Subscription": { "Vision-Based-for-Re-Dresser": { "Vision-Based variant for Re-Dresser": this.selectors["Vision-Based-Re-Dresser"][0] } } }, this.bitindexes["Vision-Based-Re-Dresser"][0], this.selectors["Vision-Based-Re-Dresser"][1], this.bitindexes["Vision-Based-Re-Dresser"][1]);
        // this.setProduct("Service", { "Vision-Based-for-Re-Dresser": { "Vision-Based variant for Re-Dresser": this.selectors["Vision-Based-Re-Dresser"][0] } }, this.bitindexes["Vision-Based-Re-Dresser"][0], this.selectors["Vision-Based-Re-Dresser"][1], this.bitindexes["Vision-Based-Re-Dresser"][1]);
        switch (this.data_button) {
            case "Excellent":
                this.removeProductFeature({ keyorder: this.bitindexes["Vision-Based-Re-Dresser-Properties-Excellent"][0] });
                break;
            case "Basis":
            case "Standard":
                this.setProduct(null, null, this.bitindexes["Vision-Based-Re-Dresser-Properties-" + this.data_button][0], this.selectors["Vision-Based-Re-Dresser-Properties"][1], this.bitindexes["Vision-Based-Re-Dresser-Properties-" + this.data_button][1]);
                break;
            default:
                if (this.cell.classList.contains("open-close-button")) {
                    this.#handlePopupTable();
                }
                break;
        }
    }

    #HandleVisionBasedReDresser() {
        const state = this.#toggleSelector(this.data_button);
        this.#toggleButton();
        this.#toggleInfoText(this.data_button);
        this.setProduct("Feature", { Service: true });
        this.setProduct("Tool: Re-Dresser™", { "Subscription": { "Vision-Based-for-Re-Dresser": { "Vision-Based variant for Re-Dresser": state ? this.selectors["Vision-Based-Re-Dresser"][0] : "✘" } } }, this.bitindexes["Vision-Based-Re-Dresser"][0], state ? this.selectors["Vision-Based-Re-Dresser"][1] : 0, this.bitindexes["Vision-Based-Re-Dresser"][1]);
        // this.setProduct("Service", { "Vision-Based-for-Re-Dresser": { "Vision-Based variant for Re-Dresser": state ? this.selectors["Vision-Based-Re-Dresser"][0] : "✘" } }, this.bitindexes["Vision-Based-Re-Dresser"][0], state ? this.selectors["Vision-Based-Re-Dresser"][1] : 0, this.bitindexes["Vision-Based-Re-Dresser"][1]);
        if (state) {
            this.#unlockPanel("sub-panel", "Vision-Based-Re-Dresser-Properties");
            this.#clickAnyButton(this.selectors["Vision-Based-Re-Dresser"][0], "Vision-Based-Re-Dresser-Properties");
        } else {
            this.#lockPanel("sub-panel", "Vision-Based-Re-Dresser-Properties");
        }
    }

    #handleToolControlVariant() {
        this.setSelectors("Tool-Control", this.data_button, this.button_index + 1);
        this.#selectExclusive();
        this.#updateInfoText();
        this.#handleTableCols(this.sub_panel.id);

        this.setProduct("Tool: Re-Dresser™", { "Subscription": { "Tool-Control": { "Tool-Control for Re-Dresser": this.selectors["Tool-Control"][0] } } }, this.bitindexes["Tool-Control"][0], this.selectors["Tool-Control"][1], this.bitindexes["Tool-Control"][1]);
        // this.setProduct("Service", { "Tool-Control": { "Tool-Control for Re-Dresser": this.selectors["Tool-Control"][0] } }, this.bitindexes["Tool-Control"][0], this.selectors["Tool-Control"][1], this.bitindexes["Tool-Control"][1]);
        switch (this.data_button) {
            case "Excellent":
                this.removeProductFeature({ keyorder: this.bitindexes["Tool-Control-Variant-Excellent"][0] });
                break;
            case "Basis":
            case "Standard":
                this.setProduct(null, null, this.bitindexes["Tool-Control-Variant-" + this.data_button][0], this.selectors["Tool-Control-Variant"][1], this.bitindexes["Tool-Control-Variant-" + this.data_button][1]);
                break;
            default:
                if (this.cell.classList.contains("open-close-button")) {
                    this.#handlePopupTable();
                }
                break;
        }
    }


    #HandleToolControl() {
        const state = this.#toggleSelector(this.data_button);
        this.#toggleButton();
        this.#toggleInfoText(this.data_button);
        this.setProduct("Feature", { Service: true });
        this.setProduct("Tool: Re-Dresser™", { "Subscription": { "Tool-Control": { "Tool-Control for Re-Dresser": state ? this.selectors["Tool-Control"][0] : "✘" } } }, this.bitindexes["Tool-Control"][0], state ? this.selectors["Tool-Control"][1] : 0, this.bitindexes["Tool-Control"][1]);
        // this.setProduct("Service", { "Tool-Control": { "Tool-Control for Re-Dresser": state ? this.selectors["Tool-Control"][0] : "✘" } }, this.bitindexes["Tool-Control"][0], state ? this.selectors["Tool-Control"][1] : 0, this.bitindexes["Tool-Control"][1]);
        if (state) {
            this.#unlockPanel("sub-panel", "Tool-Control-Variant");
            this.#clickAnyButton(this.selectors["Tool-Control"][0], "Tool-Control-Variant");

        } else {
            this.#lockPanel("sub-panel", "Tool-Control-Variant");
        }
    }

    #handleSoftware() {
        switch (this.data_button) {
            case "Vision-Based":
                this.#toggleButton("Software", 2);
                this.#togglePanel("sub-panel", "Vision-Based", this.current_step.id, this.selectors.Software[2]);
                this.#toggleInfoText("Vision-Based", null, this.selectors.Software[2], "Software");
                if (this.selectors.Software[2]) {
                    this.setProduct("Robot", { "Subscription": { "Software": { "Vision-Based": this.selectors["Vision-Based"][0] } } }, this.bitindexes["Vision-Based"][0], this.selectors["Vision-Based"][1], this.bitindexes["Vision-Based"][1]);
                    this.#clickAnyButton(this.selectors["Vision-Based"][0], "Vision-Based");
                } else {
                    this.setProduct("Robot", { "Subscription": { "Software": { "Vision-Based": "✘" } } }, this.bitindexes["Vision-Based"][0], 0, this.bitindexes["Vision-Based"][1]);
                }
                break;
            case "Sky-Vision":
                this.#toggleButton("Software", 3);
                this.#toggleButton("Sky-Vision");
                if (this.selectors.Software[3]) {
                    this.setProduct("Robot", { "Subscription": { "Software": { "Sky-Vision": "✔" } } }, this.bitindexes["Sky-Vision"][0], 1, this.bitindexes["Sky-Vision"][1]);
                } else {
                    this.setProduct("Robot", { "Subscription": { "Software": { "Sky-Vision": "✘" } } }, this.bitindexes["Sky-Vision"][0], 0, this.bitindexes["Sky-Vision"][1]);
                }
                break;
            case "Drive-Cab":
                this.#toggleButton("Software", 4);
                if (this.selectors.Software[4]) {
                    this.setProduct("Robot", { "Subscription": { "Software": { "Drive-Cab": "✔" } } }, this.bitindexes["Software-Drive-Cab"][0], 1, this.bitindexes["Software-Drive-Cab"][1]);
                } else {
                    this.setProduct("Robot", { "Subscription": { "Software": { "Drive-Cab": "✘" } } }, this.bitindexes["Software-Drive-Cab"][0], 0, this.bitindexes["Software-Drive-Cab"][1]);
                }
                break;
            default:
                return;
        }
    }

    #handleVisionBased() {
        this.setSelectorsExt(this.sub_panel.id, this.data_button, this.button_index + 1, 0);
        this.#selectExclusive();
        this.#handleTableCols(this.sub_panel.id);
        this.setProductRobotSubscription({ "Software": { "Vision-Based": this.selectors["Vision-Based"][0] } }, this.bitindexes["Vision-Based"][1], "Vision-Based");
        this.#handleTableCols(this.sub_panel.id);
        switch (this.data_button) {
            case "Excellent":
                this.removeProductFeature({ keyorder: this.bitindexes["Vision-Based-" + this.data_button][0] });
                break;
            case "Basis":
            case "Standard":
                this.setProductBitValue(this.bitindexes["Vision-Based-" + this.data_button][0], 0, this.bitindexes["Vision-Based-" + this.data_button][1]);
                break;
            default:
                break;
        }

        if (this.cell.classList.contains("open-close-button")) {
            this.#handlePopupTable();
        }
    }

    handleStep9() {
        switch (this.sub_panel.id) {
            case "Acquire":
                this.#handleAcquire();
                break;
            case "Innovation-Partner":
                this.#handleInnoPartner();
                break;
            default:
                break;
        }
        this.#unlockStep(10);
    }

    handleStep10() {
        switch (this.sub_panel.id) {
            case "Subscription":
                this.#handleSubscription();
                break;
            case "Service":
                this.#handleSubscriptionClass();
                break;
            case "Software":
                this.#handleSoftware();
                break;
            case "Vision-Based":
                this.#handleVisionBased();
                break;
            case "Subscription-Class-Re-Dresser":
                this.#handleSubscriptionClassReDresser();
                break;
            case "Subscription-Type-Re-Dresser":
                this.#handleSubscriptionTypeReDresser();
                break;
            case "Vision-Based-Re-Dresser":
                this.#HandleVisionBasedReDresser();
                break;
            case "Vision-Based-Re-Dresser-Properties":
                this.#handleVisionBasedReDresserVariant();
                break;
            case "Tool-Control":
                this.#HandleToolControl();
                break;
            case "Tool-Control-Variant":
                this.#handleToolControlVariant();
                break;
            default:
                break;
        }
        this.#unlockStep(10);
    }

    handleStep11() {
        this.event.preventDefault();
        switch (this.data_button) {
            case "Order-List":
            case "Continue":
                this.#handleGoToOrderList();
                break
            case "Modify":
            case "submit":
                this.handleModify();
                break;
            default:
                break;
        }
    }

    // #handleRequest() {
    //     const inputElement = this.current_step.querySelector(`[data-button="${this.data_button}"]`);
    //     inputElement.classList.toggle("active");
    //     const fieldContainer = inputElement.closest(".contact-form-field");
    //     const labelEl = fieldContainer.querySelector("label[for='request']");
    //     if (!labelEl) return;

    //     const isHidden = labelEl.classList.toggle("hide");
    //     this.togglers.Request = isHidden;
    //     labelEl.setAttribute("aria-hidden", isHidden ? "true" : "false");
    //     return;
    // }

    #handleSubscriptionTypeReDresser() {
        switch (this.data_button) {
            case "Software":
                this.#toggleButton("Software-Re-Dresser");
                this.#togglePanel("sub-panel", "Mac-Mapp-Re-Dresser");
                this.#togglePanel("sub-panel", "Vision-Based-Re-Dresser");
                break;
            case "Service":
                this.#toggleButton("Service-Re-Dresser");
                this.#togglePanel("sub-panel", "Subscription-Class-Re-Dresser");
                break;
            default:
                return;
        }

        // Determine current toggle states
        const softwareOn = this.selectors["Software-Re-Dresser"][1];
        const serviceOn = this.selectors["Service-Re-Dresser"][1];

        // Reset all info texts
        this.#disableInfoText("Software");
        this.#disableInfoText("Service");
        this.#disableInfoText("Both");

        // Apply correct visibility
        if (softwareOn && serviceOn) {
            this.#enableInfoText("Both");
        } else if (softwareOn) {
            this.#enableInfoText("Software");
        } else if (serviceOn) {
            this.#enableInfoText("Service");
        }
        this.setProduct("Tool: Re-Dresser™", { "Subscription": { "Re-Dresser": { "Mac-Mapp": "✔" } } }, null, 0, null);

    }

    #unlockContactForm() {
        this.current_step.querySelector(".contact-form-container").classList.remove("hide");
    }

    #lockContactForm() {
        this.current_step.querySelector(".contact-form-container").classList.add("hide");
    }


    // #handleItemAddition(inputId, labelText) {
    //     const inputElement = this.current_step.querySelector(`[data-name="${inputId}"]`);
    //     if (!inputElement) return;

    //     const fieldContainer = inputElement.closest(".contact-form-field");
    //     if (!fieldContainer) return;

    //     const counterElement = fieldContainer.querySelector(".content");
    //     const listContainer = fieldContainer.querySelector(".content-box");
    //     if (!counterElement || !listContainer) return;

    //     const inputValue = inputElement.value.trim();
    //     if (inputValue === "") return;

    //     // Create and append new list item
    //     const newItem = document.createElement("li");
    //     newItem.classList.add("content-element");
    //     newItem.textContent = inputValue;
    //     listContainer.appendChild(newItem);

    //     // Update counter
    //     const match = counterElement.textContent.match(/\d+/);
    //     let currentCount = match ? parseInt(match[0], 10) : 0;
    //     counterElement.textContent = `${labelText}: ${++currentCount}`;

    //     // Clear input
    //     inputElement.value = "";
    // }

    // Collect form data; machines/tools become arrays (from .content-element items)
    // #getFormData(form) {
    //     if (!form) return {};

    //     const inputs = form.querySelectorAll("[name]");
    //     const data = {};

    //     inputs.forEach(input => {
    //         if (input.type && input.type.toLowerCase() === "hidden") return;
    //         const name = input.name;
    //         if (name === "machines" || name === "tools") {
    //             const fieldContainer = input.closest(".contact-form-field");
    //             const listItems = fieldContainer?.querySelectorAll(".content-box .content-element") ?? [];
    //             const arr = Array.from(listItems)
    //                 .map(li => li.textContent.trim())
    //                 .filter(v => v !== "");
    //             data[name] = arr;
    //         } else {
    //             // For other inputs (including textarea) store trimmed value
    //             data[name] = (input.value ?? "").trim();
    //         }
    //     });

    //     return data;
    // }

    // #isFormFilled(form) {
    //     if (!form) return false;
    //     const requiredEls = Array.from(form.querySelectorAll("[required]"));
    //     if (requiredEls.length === 0) return true;
    //     return requiredEls.every(input => {
    //         const name = input.name;

    //         if (name === "machines" || name === "tools") {
    //             const fieldContainer = input.closest(".contact-form-field");
    //             if (!fieldContainer) return false;
    //             const listItems = fieldContainer.querySelectorAll(".content-box .content-element");
    //             return listItems.length > 0;
    //         } else {
    //             const val = (input.value ?? "").trim();
    //             return val !== "";
    //         }
    //     });
    // }

    async #handleGoToOrderList() {
        let BusinessCaseResult = null;
        try {
            if (this.selectors.Login[0] !== "Login" && this.data_button === "Order-List") {
                BusinessCaseResult = await this.contactform.formComplete(['Business-Case']);
            }
        } catch (err) {
            console.error("Failed to save BusinessCase to localStorage:", err);
        } finally {
            if (!BusinessCaseResult) return;
            localStorage.setItem("BusinessCase", JSON.stringify(BusinessCaseResult.data));
            this.#updateProductSpec();
            this.product.exportData();
            // this.goToNewTabURL("/html/contents/Configurator/Order.html");
        }
    }


    #updateProductSpec() {
        this.#updateReDresserSpec();
        this.#updateVisionBasedReDresserServiceSpec();
        this.#updateToolControlSpec();
    }

    #handleReDresserColor() {
        this.#selectExclusive();
        this.#updateInfoText();
        this.setSelectors("Re-Dresser-Color");
        if (this.data_button === 'Custom-Edition') {
            this.#handleCustomColor();
        }
        this.setProductToolFeatures("Re-Dresser™", "Color", "Re-Dresser-Color", "Re-Dresser-Color");
        // this.setProduct("Tools", { "Re-Dresser": { "Color": this.selectors["Re-Dresser-Color"][0] } }, this.bitindexes["Re-Dresser-Color"][0], this.selectors["Re-Dresser-Color"][1], this.bitindexes["Re-Dresser-Color"][1]);
    }

    handleUnlockAllButton() {
        this.#selectExclusive();
        this.#unlockStepsUpTo(this.maxIndex);
        this.current_state_index = this.maxIndex;
        this.show_Tools_Only = false;
        this.expose_all = true;
    }

    #handleBranchVariants() {
        const heroes = this.image_panel_hero_container?.querySelectorAll('.image-panel-hero') || [];
        heroes.forEach(h => {
            h.classList.toggle('defender-bg', this.data_button === 'Defender');
            h.classList.toggle('agro-bg', this.data_button === 'Agro');
        });
        this.#selectExclusive();
        this.#updateInfoText();
        this.setSelectors(this.sub_panel.id);
        this.setProductRobotFeatures("Branch Variant", "Branch-Variants", "Branch-Variants")
        if (!this.show_Tools_Only) {
            const robot_image_data = (this.selectors.Branch[0] === "Sport" && this.selectors.Model[0] === "Premium") ? "Premium-Solo-Asymmetric-Duo" : this.selectors.Model[0];
            this.#showSelectedImage("Robot", robot_image_data);
            this.#unlockPanel("sub-panel", "Configuration-Scope");
            this.#clickAnyButton("Basis", "Configuration-Scope", 'step-5');
        }
    }

    handleModify() {
        this.#updateProductSpec();
        const loginForm = document.querySelector("#loginForm");
        const usernameInput = loginForm.querySelector("#UserName");
        const passwordInput = loginForm.querySelector("#PassWord");

        loginForm.classList.remove("hide");

        if (this.data_button === "submit") {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            if (!username || !password) {
                alert("Username and password are required.");
                return;
            }
            this.sendToOfferDB(username, password, APICALL.OFFER_ADMIN_LOGIN);
        }
    }

    sendToOfferDB(username, password, phpfile) {
        fetch(phpfile, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Unauthorized");
                }
                return res.text();
            })
            .then(text => {
                if (!text) {
                    console.warn("⚠️ Empty response from server");
                    alert("PHP reached, but no response was returned.");
                    return;
                }
                let data;
                try {
                    data = JSON.parse(text);
                } catch (err) {
                    console.error("❌ Failed to parse JSON:", text);
                    alert("Server responded with invalid JSON.");
                    return;
                }
                if (data.success) {
                    console.log("✅ Login successful:", data);
                    alert("✅ Login successful — redirecting to Excellent Edition editor...");
                    this.product.exportToOffer()
                        .then(() => {
                            this.goToNewTabURL("/html/contents/Configurator/Excellent-Edition.html");
                        })
                        .catch(err => {
                            console.error("❌ Failed to export offer:", err);
                            alert("Export failed. Please try again.");
                        });
                } else {
                    console.warn("❌ Login failed:", data.error);
                    alert("Login failed: " + (data.error || "Unknown error"));
                }
            })
            .catch(err => {
                console.error("❌ Fetch error:", err);
                alert("❌ Access denied — invalid credentials");
            });
    }

    goToNewTabURL(url) {
        this.orderTabs = this.orderTabs.filter(tab => tab && !tab.closed);

        if (this.orderTabs.length === 0) {
            const newTab = window.open(url, "Order");
            if (newTab) {
                this.orderTabs.push(newTab);
                newTab.focus();
            }
        } else {
            this.orderTabs.forEach((tab, i) => {
                try {
                    tab.location.href = url;
                    if (i === 0) tab.focus();
                } catch (e) {
                    console.warn("Could not update tab", e);
                }
            });
        }
    }

    #handleSubscription() {
        switch (this.data_button) {
            case "Service":
                this.#toggleButton("Subscription", 0);
                this.#togglePanel("sub-panel", "Service", "step-10", this.selectors.Subscription[0]);
                this.#clickAnyButton(this.selectors.Service[0], "Service");
                break;

            case "Software":
                this.#toggleButton("Subscription", 1);
                this.#togglePanel("sub-panel", "Software", "step-10", this.selectors.Subscription[1]);

                if (this.selectors.Subscription[1] && !this._subscriptionInputsInit) {
                    this.#initSubscriptionNumberInputs();
                    this._subscriptionInputsInit = true;
                }
                break;

            default:
                return;
        }

        this.handeleSubscriptionText();
        this.setProduct("Robot", { "Subscription": { "Mac-Mapp": "✔" } }, null, 0, null);
    }

    #isPositiveInt(value) {
        const n = Number(value);
        return Number.isInteger(n) && n > 0;
    }

    #clampInt(value, min = 0, max = 4095) {
        const n = Number(value);
        if (!Number.isFinite(n)) return min;
        return Math.min(max, Math.max(min, Math.trunc(n)));
    }

    #blockNonIntegerKeys(e) {
        if (e.ctrlKey || e.metaKey) return;

        const allowed = [
            "Backspace", "Delete", "Tab", "Escape", "Enter",
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"
        ];
        if (allowed.includes(e.key)) return;

        // kun 0-9
        if (!/^\d$/.test(e.key)) e.preventDefault();
    }

    #initSubscriptionNumberInputs() {
        const panel = this.container.querySelector("#Software");
        if (!panel) return;

        const groups = panel.querySelectorAll('.grid-cells.numeric-inputs[data-field]');
        groups.forEach(groupEl => {
            const groupKey = groupEl.dataset.field; // fx "Users" / "Swarm"
            const inputs = groupEl.querySelectorAll(".number-cell input");

            inputs.forEach(input => {
                // keyboard hardening
                input.addEventListener("keydown", (e) => this.#blockNonIntegerKeys(e));

                // wheel hardening
                input.addEventListener("wheel", () => input.blur(), { passive: true });

                // clamp + update UI
                input.addEventListener("input", (e) => {
                    const maxAttr = e.target.getAttribute("max");
                    const max = maxAttr ? Number(maxAttr) : 4095;

                    const clamped = this.#clampInt(e.target.value, 0, Number.isFinite(max) ? max : 4095);
                    if (String(clamped) !== e.target.value) e.target.value = String(clamped);
                    this.selectors[e.target.name] = e.target.value;
                    this.setProductRobot({ "Subscription": { "Software": { [groupKey]: { [e.target.name]: e.target.value } } } }, this.selectors[e.target.name], e.target.name);
                    this.#updateNumericGroup(panel, groupKey);
                });

                input.addEventListener("blur", (e) => {
                    if (e.target.value === "") e.target.value = "0";
                });
            });

            this.#updateNumericGroup(panel, groupKey);
        });
    }

    #updateNumericGroup(panel, groupKey) {
        const groupInputs = panel.querySelectorAll(
            `.grid-cells.numeric-inputs[data-field="${groupKey}"] .number-cell`
        );

        let anyActive = false;

        groupInputs.forEach(cell => {
            const fieldKey = cell.dataset.field; // fx "Operational-Administrator" eller "Re-Bot-UGV"
            const input = cell.querySelector("input");
            const active = input ? this.#isPositiveInt(input.value) : false;

            // Toggle corresponding infobox text (data-text = fieldKey)
            const textEl = panel.querySelector(`.infobox-text[data-text="${fieldKey}"]`);
            if (textEl) textEl.classList.toggle("active", active);

            if (active) anyActive = true;
        });

        // Toggle group container
        const groupBox = panel.querySelector(`.infobox-group[data-group="${groupKey}"]`);
        if (groupBox) groupBox.classList.toggle("active", anyActive);
    }


    handeleSubscriptionText() {
        this.#disableInfoText("Software", "Subscription");
        this.#disableInfoText("Service", "Subscription");
        this.#disableInfoText("Both", "Subscription");

        const software = !!this.selectors.Subscription[1];
        const service = !!this.selectors.Subscription[0];

        const mask = (software << 1) | (service << 0);

        switch (mask) {
            case 3:
                this.#enableInfoText("Both", "Subscription");
                break;
            case 2:
                this.#enableInfoText("Software", "Subscription");
                break;
            case 1:
                this.#enableInfoText("Service", "Subscription");
                break;
            default:
                break;
        }
    }


    #resolveButton(data_button, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        const panelId = sub_panel ?? null;
        if (panelId) {
            return this.steps[step]?.querySelector(`#${panelId} button[data-button="${data_button}"]`);
        } else {
            return this.steps[step]?.querySelector(`button[data-button="${data_button}"]`);
        }
    }

    #clickAnyButton(data_button, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        this._programmaticClickDepth++;
        this.#resolveButton(data_button, sub_panel, step)?.click();
        this._programmaticClickDepth--;
    }

    #isButtonActive(data_button, sub_panel = this?.sub_panel.id, step = this.current_step.id) {
        return this.#resolveButton(data_button, sub_panel, step)?.classList.contains('active');
    }

    #activateAnyButton(data_button, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        this.#resolveButton(data_button, sub_panel, step)?.classList.add('active');
    }

    #deactivateAnyButton(data_button, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        this.#resolveButton(data_button, sub_panel, step)?.classList.remove('active');
    }

    #selectAnyButton(data_button, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        if (!this.#isButtonActive(data_button, sub_panel, step)) {
            this.#activateAnyButton(data_button, sub_panel, step);
            this.#clickAnyButton(data_button, sub_panel, step);
        }
    }

    #deselectAnyButton(data_button, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        if (this.#isButtonActive(data_button, sub_panel, step)) {
            this.#deactivateAnyButton(data_button, sub_panel, step);
            this.#clickAnyButton(data_button, sub_panel, step);
        }
    }

    #hideAnyButton(data_button, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        this.#resolveButton(data_button, sub_panel, step)?.classList.add('hide');
    }

    #showAnyButton(data_button, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        this.#resolveButton(data_button, sub_panel, step)?.classList.remove('hide');
    }

    #recommendButton(data_button, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        this.#resolveButton(data_button, sub_panel, step)?.classList.add('recommended');
    }

    #unrecommendButton(data_button, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        this.#resolveButton(data_button, sub_panel, step)?.classList.remove('recommended');
    }

    #showContactForm(id, step = this.current_step) {
        step.querySelector(`#${id}.contact-form-box`).classList.remove('hide');
    }

    #hideContactForm(id) {
        step.querySelector(`#${id}.contact-form-box`).classList.add('hide');
    }

    setSelectors(key = this.sub_panel.id, button = this.data_button, index = this.button_index) {
        this.selectors[key] = [button, index];
    }

    setSelectorsExt(key, value, index = null, position = 0) {
    if (!(key in this.selectors)) {
        throw new Error(`setSelector: Ukendt selector-key "${key}"`);
    }

    const current = this.selectors[key];

    // Case 1: scalar (number / boolean / string)
    if (!Array.isArray(current)) {
        this.selectors[key] = value;
        return;
    }

    // Case 2: array
    const next = [...current];

    // position 0 = value
    if (position !== null) {
        if (position < 0 || position >= next.length) {
            throw new Error(
                `setSelector: position ${position} out of bounds for "${key}" (length ${next.length})`
            );
        }
        next[position] = value;
    }

    // optional index-position (konventionelt position 1)
    if (index !== null && next.length > 1) {
        next[1] = index;
    }

    this.selectors[key] = next;
}


    setSelector(key, value, index = null, position = 0) {
    if (!(key in this.selectors)) {
        throw new Error(`setSelector: Ukendt selector-key "${key}"`);
    }

    const current = this.selectors[key];

    // Case 1: scalar (number / boolean / string)
    if (!Array.isArray(current)) {
        this.selectors[key] = value;
        return;
    }

    // Case 2: array
    const next = [...current];

    // position 0 = value
    if (position !== null) {
        if (position < 0 || position >= next.length) {
            throw new Error(
                `setSelector: position ${position} out of bounds for "${key}" (length ${next.length})`
            );
        }
        next[position] = value;
    }

    // optional index-position (konventionelt position 1)
    if (index !== null && next.length > 1) {
        next[1] = index;
    }

    this.selectors[key] = next;
}


    #handleColorVariants() {
        if (this.data_button === 'Custom-Edition') {
            this.#handleCustomColor();
        }
        this.#selectExclusive();
        this.#updateInfoText();
        this.setSelectors();
        this.setProductRobotFeatures("Color", "Color", "Color")
    }

    #handleCustomColor(event) {
        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }

        const scope = this.sub_panel;
        if (!scope) {
            console.error("❌ this.sub_panel er ikke defineret.");
            return;
        }

        const panelId = scope.id || "default";

        // init container til panel-farver, hvis ikke den findes
        if (!this._panelColors) {
            this._panelColors = {};
        }
        if (!this._panelColors[panelId]) {
            this._panelColors[panelId] = {};
        }

        const overlay = scope.querySelector(".colorOverlay");
        const dialog = scope.querySelector(".dialog");
        const primaryInput = scope.querySelector(".userColor-main");
        const subInput = scope.querySelector(".userColor-sub");

        const customBtn = scope.querySelector(
            '.content-cell.color-circle.semi-circle[data-button="Custom-Edition"]'
        );

        const applyBtn = scope.querySelector(".js-applyPalette");
        const cancelBtn = scope.querySelector(".js-cancelPalette");

        const RALMainNumber = scope.querySelector(".ral-main");
        const RALSubNumber = scope.querySelector(".ral-sub");

        if (!overlay || !dialog || !primaryInput || !subInput || !customBtn) {
            console.warn("[CustomColor] Missing essential elements in panel", scope.id);
            return;
        }

        // Hent panel-specifikke defaults (eller fald tilbage til globale defaults)
        const stored = this._panelColors[panelId];

        const defaultMain =
            stored.main ||
            getComputedStyle(document.documentElement)
                .getPropertyValue("--engbakken-color")
                .trim() ||
            "#a9d52f";

        const defaultSub = stored.sub || "#e0e0e0";

        primaryInput.value = defaultMain;
        subInput.value = defaultSub;

        let tempMain = defaultMain;
        let tempSub = defaultSub;

        const updateButtonBackground = (mainColor, subColor) => {
            const main = mainColor || defaultMain;
            const secondary = subColor || defaultSub;

            customBtn.style.background =
                `linear-gradient(to bottom, ${main} 70%, ${secondary} 70%)`;
            customBtn.style.borderRadius = "50%";
            customBtn.style.border = `3px solid ${secondary}`;
            customBtn.style.boxShadow = `0 0 0.6rem ${secondary}`;

            const nearestMain = findNearestRAL(main);
            const nearestSub = findNearestRAL(secondary);

            if (RALMainNumber) {
                RALMainNumber.textContent = nearestMain ? `${nearestMain.code} (main)` : "";
            }
            if (RALSubNumber) {
                RALSubNumber.textContent = nearestSub ? `${nearestSub.code} (sub)` : "";
            }
        };

        // Første visning når dialogen åbner
        updateButtonBackground(tempMain, tempSub);

        overlay.classList.remove("hide");
        overlay.setAttribute("aria-hidden", "false");
        primaryInput.focus();

        primaryInput.oninput = (e) => {
            tempMain = e.target.value;
            updateButtonBackground(tempMain, tempSub);
        };

        subInput.oninput = (e) => {
            tempSub = e.target.value;
            updateButtonBackground(tempMain, tempSub);
        };

        const closeDialog = () => {
            overlay.classList.add("hide");
            overlay.setAttribute("aria-hidden", "true");
        };

        const handleCancel = () => {
            // Rul tilbage til senest gemte værdier for dette panel
            updateButtonBackground(defaultMain, defaultSub);
            closeDialog();
        };

        if (cancelBtn) {
            cancelBtn.onclick = handleCancel;
        }

        if (applyBtn) {
            applyBtn.onclick = () => {
                // 🔑 Gem farver kun for dette panel
                this._panelColors[panelId] = {
                    main: tempMain,
                    sub: tempSub,
                };
                closeDialog();
            };
        }
    }




    #handleTrackBased() {
        this.#selectExclusive();
        this.#updateInfoText();
        switch (this.data_button) {
            case "Tyres":
                this.#unlockPanel("sub-panel", "Tyre-Types");
                this.#lockPanel("sub-panel", "Track-Types");
                this.setProductRobot({ "Equipment": { "Ground contact": "Tyres" } }, 0, "Track-Based");
                this.setProductRobotEquipment("Track based", "Tyre-Types", "Track-Based");
                if (this.saved_wheel[0] !== null) {
                    this.hideAllCarruselTypes("wheel");
                }
                this.#enableCarruselCard(this.saved_wheel[0]);
                break;
            case "Tracks":
                this.#unlockPanel("sub-panel", "Track-Types");
                this.#lockPanel("sub-panel", "Tyre-Types");
                this.setProductRobot({ "Equipment": { "Ground contact": "Tracks" } }, 1, "Track-Based");
                this.setProductRobotEquipment("Track based", "Track-Types", "Track-Based");
                if (this.saved_wheel[1] !== null) {
                    this.hideAllCarruselTypes("wheel");
                }
                this.#enableCarruselCard(this.saved_wheel[1]);
                break;
            default:
                break;
        }
    }

    #unlockStepsUpTo(n) {
        const targetIndex = Math.min(Math.max(0, n), this.maxIndex);
        for (let i = 0; i <= targetIndex; i++) this.#unlockStep(i);
    }

    #lockStepsDownTo(n) {
        // if (this.expose_all) return;
        const targetIndex = Math.min(Math.max(0, n), this.maxIndex);
        for (let i = targetIndex; i <= this.maxIndex; i++) this.#lockStep(i);
    }

    #unlockStep(n) {
        this.steps[Configurator.STEP_IDS[n]]?.classList.remove("hide");
    }

    #lockStep(n) {
        this.steps[Configurator.STEP_IDS[n]]?.classList.add("hide");
    }

    #handleFlexDrive() {
        this.#toggleButton();
        this.#toggleInfoText("with-CTI", "without-CTI", this.selectors[this.sub_panel.id][1]);
        if (this.selectors[this.sub_panel.id][1]) {
            this.#hideCarruselCard("Without-CTI");
            this.showCarruselCard("With-CTI");
            this.#activateCarruselCard("With-CTI");
            this.setProductRobotEquipment("Flex-Drive™ (CTI)", "Flex-Drive", "Flex-Drive");
        } else {
            this.showCarruselCard("Without-CTI");
            this.#hideCarruselCard("With-CTI");
            this.#activateCarruselCard("Without-CTI");
            this.setProductRobotEquipment("Flex-Drive™ (CTI)", "Flex-Drive", "Flex-Drive");
        }
    }



    #unlockPremiumFromSport() {
        if (this.selectors.Model[0] === "Premium") {
            this.#clickAnyButton('Premium', 'Robot', 'step-4');
            this.#clickAnyButton('Dual', 'Module', 'step-4');
            this.#activateAnyButton('Solo', 'Module', 'step-4');
            this.#enableInfoText('Solo', 'Module', 'step-4');
            this.#enableInfoText('Dual', 'Module', 'step-4');
            this.#clickAnyButton('Basis', 'Power-Capacity', 'step-4');
            this.#clickAnyButton('Asymmetric-Duo', 'Linkage', 'step-4');
            this.#clickAnyButton('Sport', 'Color', 'step-4');
            this.#recommendButton('Agro', 'Variants', 'step-3');
            this.#recommendButton('Re-Dresser', 'Re-Dresser', 'step-5');
            this.#showAllTyres();
            this.#hideAnyButton("TRACTOR-KING-480", "Tyre-Types", "step-6");
            this.#hideAnyButton("TRACTOR-KING-600", "Tyre-Types", "step-6");
            this.#hideAnyButton("GROUND-KING-420", "Tyre-Types", "step-6");
            this.#hideAnyButton("GROUND-KING-600", "Tyre-Types", "step-6");
            this.#hideAnyButton("GROUND-KARE-600", "Tyre-Types", "step-6");
            this.#hideAnyButton("GROUND-KARE-710", "Tyre-Types", "step-6");
            this.#hideAnyButton("TR-FOREST-2-480", "Tyre-Types", "step-6");
            this.#hideAnyButton("TR-FOREST-2-600", "Tyre-Types", "step-6");
            this.#hideAnyButton("Tracks", "Track-Based", "step-6");
            this.#lockPanel("sub-panel", "Track-Types", "step-6");
        }
    }

    #handleAgro() {
        this.#handleBranch("Agro");
        this.#showAllTyres();
        this.#unlockPanel("sub-panel", "Re-Dresser", "step-6");
        this.#clickAnyButton("Agro", "Re-Dresser-Color", "step-6");
    }

    #handleEntrepeneur() {
        this.#handleBranch("Agro");
        this.#lockPanel("sub-panel", "Re-Dresser", "step-6");
        this.removeProductFeature("Tools", "Re-Dresser");
        this.#showAllTyres();
        this.#hideAnyButton("TR-FOREST-2-480", "Tyre-Types", "step-6");
        this.#hideAnyButton("TR-FOREST-2-600", "Tyre-Types", "step-6");
    }

    #handleSport() {
        this.#handleBranch("Agro");
        this.#unlockPremiumFromSport();
        this.#unlockPanel("sub-panel", "Re-Dresser", "step-6");
        this.#clickAnyButton("Sport", "Re-Dresser-Color", "step-6");
    }

    #handleAirport() {
        this.#handleBranch("Agro");
        this.#showAllTyres();
        this.#hideAnyButton("TR-FOREST-2-480", "Tyre-Types", "step-6");
        this.#hideAnyButton("TR-FOREST-2-600", "Tyre-Types", "step-6");
        this.#lockPanel("sub-panel", "Re-Dresser", "step-6");
        this.removeProductFeature("Tools", "Re-Dresser");
    }


    #handleDefence() {
        this.#handleBranch("Defender");
        this.#lockPanel("sub-panel", "Re-Dresser", "step-6");
        this.removeProductFeature("Tools", "Re-Dresser");

        this.#showAllTyres();
        this.#hideAnyButton("TR-FOREST-2-480", "Tyre-Types", "step-6");
        this.#hideAnyButton("TR-FOREST-2-600", "Tyre-Types", "step-6");
        this.#hideAnyButton("COUNTRY-KING-560", "Tyre-Types", "step-6");
        this.#hideAnyButton("COUNTRY-KING-710", "Tyre-Types", "step-6");
    }


    #handleNGO() {
        this.#handleBranch("Defender");
        this.#lockPanel("sub-panel", "Re-Dresser", "step-6");
        this.#lockPanel("sub-panel", "Bulk-Dump", "step-6");
        this.#lockPanel("sub-panel", "Bulk-Agro", "step-6");
        this.removeProductFeature("Tools", "Re-Dresser");
        this.removeProductFeature("Tools", "Bulk-Dump");
        this.removeProductFeature("Tools", "Bulk-Agro");
        this.#showAllTyres();
        this.#hideAnyButton("TR-FOREST-2-480", "Tyre-Types", "step-6");
        this.#hideAnyButton("TR-FOREST-2-600", "Tyre-Types", "step-6");
        this.#hideAnyButton("COUNTRY-KING-560", "Tyre-Types", "step-6");
        this.#hideAnyButton("COUNTRY-KING-710", "Tyre-Types", "step-6");
    }

    #showAllTyres() {
        this.#showAnyButton("TRACTOR-KING-480", "Tyre-Types", "step-6");
        this.#showAnyButton("TRACTOR-KING-600", "Tyre-Types", "step-6");
        this.#showAnyButton("GROUND-KING-420", "Tyre-Types", "step-6");
        this.#showAnyButton("GROUND-KING-600", "Tyre-Types", "step-6");
        this.#showAnyButton("GROUND-KARE-600", "Tyre-Types", "step-6");
        this.#showAnyButton("GROUND-KARE-710", "Tyre-Types", "step-6");
        this.#showAnyButton("COUNTRY-KING-560", "Tyre-Types", "step-6");
        this.#showAnyButton("COUNTRY-KING-710", "Tyre-Types", "step-6");
        this.#showAnyButton("TR-FOREST-2-480", "Tyre-Types", "step-6");
        this.#showAnyButton("TR-FOREST-2-600", "Tyre-Types", "step-6");
    }

    #hideAllTyres() {
        this.#hideAnyButton("TRACTOR-KING-480", "Tyre-Types", "step-6");
        this.#hideAnyButton("TRACTOR-KING-600", "Tyre-Types", "step-6");
        this.#hideAnyButton("GROUND-KING-420", "Tyre-Types", "step-6");
        this.#hideAnyButton("GROUND-KING-600", "Tyre-Types", "step-6");
        this.#hideAnyButton("GROUND-KARE-600", "Tyre-Types", "step-6");
        this.#hideAnyButton("GROUND-KARE-710", "Tyre-Types", "step-6");
        this.#hideAnyButton("COUNTRY-KING-560", "Tyre-Types", "step-6");
        this.#hideAnyButton("COUNTRY-KING-710", "Tyre-Types", "step-6");
        this.#hideAnyButton("TR-FOREST-2-480", "Tyre-Types", "step-6");
        this.#hideAnyButton("TR-FOREST-2-600", "Tyre-Types", "step-6");
    }

    #hideBiggerTyres() {
        this.#hideAnyButton("TRACTOR-KING-600", "Tyre-Types", "step-6");
        this.#hideAnyButton("GROUND-KING-600", "Tyre-Types", "step-6");
        this.#hideAnyButton("GROUND-KARE-710", "Tyre-Types", "step-6");
        this.#hideAnyButton("COUNTRY-KING-710", "Tyre-Types", "step-6");
        this.#hideAnyButton("TR-FOREST-2-600", "Tyre-Types", "step-6");
    }

    #handleBranch(variant) {
        this.#selectExclusive();
        this.#showSelectedImage("Branch");
        this.#showSelectedImageText("Branch", "Robot", this.selectors.Model[0]);
        this.setSelectors("Branch");
        this.setProductHeaderWiithBitIndex({ "Branch": this.selectors.Branch[0] }, this.selectors.Branch[1], "Branch");
        this.#clickAnyButton(this.data_button, 'Color', 'step-4');
        this.#clickAnyButton(variant, 'Branch-Variants', "step-4");
        this.#unlockStep(3);
        this.#unlockStep(4);
        this.#unlockStep(5);
    }


    #handleReDresser() {
        this.#toggleButton();
        this.#toggleInfoText(this.sub_panel.id);
        this.#toggleCarrusel(this.selectors[this.sub_panel.id][1], this.sub_panel.id);
        if (this.selectors[this.sub_panel.id][1]) {
            this.#unlockReDresserProperties();
        } else {
            this.#lockReDresserProperties();
        }
    }

    #handleReDresserType() {
        this.#selectExclusive();
        this.#updateInfoText();
        this.setSelectors();
        this.setProductToolFeatures("Re-Dresser™", "Type", this.sub_panel.id, this.sub_panel.id);
        // this.setProduct("Tools", { "Re-Dresser": { "Type": this.selectors[this.sub_panel.id][0] } }, this.bitindexes[this.sub_panel.id][0], this.selectors[this.sub_panel.id][1], this.bitindexes[this.sub_panel.id][1]);
        this.#unlockReDresserProperties();
    }

    #lockReDresserProperties() {
        this.#lockPanel("sub-panel", "Re-Dresser-Variants");
        this.#lockPanel("sub-panel", "Re-Dresser-Properties");
        this.#lockPanel("sub-panel", "Re-Dresser-Color");
        this.setProductHeader({ "Tools": { "Re-Dresser": false } }, 0);
        this.#lockPanel("selection-panel", 'Tools', 'step-10');
        this.#unlockStep(10);
    }

    #unlockReDresserProperties() {
        this.#unlockPanel("sub-panel", "Re-Dresser-Variants");
        this.#unlockPanel("sub-panel", "Re-Dresser-Color");
        this.#unlockPanel("sub-panel", "Re-Dresser-Properties");
        this.#unlockPanel("selection-panel", 'Tools', 'step-10');
        this.#unlockPanel("sub-panel", 'Subscription-Type-Re-Dresser', 'step-10');
        this.setProductToolFeatures("Re-Dresser™", "Re-Dresser™", "Re-Dresser", "Re-Dresser");
        this.setProductToolFeatures("Re-Dresser™", "Type", "Re-Dresser-Variants", "Re-Dresser-Variants");
        this.setProductHeader({ "Tools": { "Re-Dresser": true } }, 1);
        this.#clickAnyButton(this.selectors["Re-Dresser-Properties"][0], 'Re-Dresser-Properties');
        this.#lockStepsDownTo(10);
    }


    #handleReDresserProperties() {
        this.#selectExclusive();
        this.setSelectorsExt(this.sub_panel.id, this.data_button, this.button_index + 1, 0);
        this.setProductToolFeatures("Re-Dresser™", "Property", this.sub_panel.id, this.sub_panel.id);
        this.#handleTableCols(this.sub_panel.id);
        switch (this.data_button) {
            case "Excellent":
            case "Basis":
            case "Standard":
                this.setProductBitValue(this.bitindexes["Re-Dresser-Properties-" + this.data_button][0], 0, this.bitindexes["Re-Dresser-Properties-" + this.data_button][1]);
                break;
            default:
                break;
        }


        if (this.cell.classList.contains("open-close-button")) {
            this.#handlePopupTable();
        }

        this.#unlockStep(7);
    }

    #handlePopupTable() {
        const key = (typeof this.data_button !== 'undefined')
            ? String(this.data_button)
            : (this.cell?.dataset?.button ? String(this.cell.dataset.button) : null);
        if (!key) return;

        // Find nærmeste subpanel
        const subPanel = this.cell?.closest('.sub-panel');
        if (!subPanel || !subPanel.id) return;

        const currentType = subPanel.id; // Matcher pop-up-container[data-type]

        const esc = s => (typeof CSS !== 'undefined' && CSS.escape)
            ? CSS.escape(s)
            : String(s).replace(/([ !"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');

        // Find korrekt pop-up-container
        const container = document.querySelector(`.pop-up-container[data-type="${esc(currentType)}"]`);
        if (!container) return;

        const popUp = container.querySelector(`.pop-up[data-pop-up="${esc(key)}"]`);
        if (!popUp) return;

        // Tag-håndtering
        const tag = this.selectors?.[currentType] || null;
        const hasTag = popUp.querySelector('[data-tag]');

        // Hvis popup har tag-sektioner → filtrér
        if (hasTag && tag) {
            popUp.querySelectorAll('.pop-up-content.text').forEach(el => {
                if (el.dataset.tag === String(tag[0])) {
                    el.classList.remove('hide');
                } else {
                    el.classList.add('hide');
                }
            });
        }

        // --- Overlay og visning (uændret)
        let overlay = container.querySelector('.pop-up-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'pop-up-overlay';
            container.insertBefore(overlay, container.firstChild);
        }

        const hideAll = () => {
            container.querySelectorAll('.pop-up').forEach(p => {
                p.classList.add('hide');
                p.classList.remove('show');
                p.setAttribute('aria-hidden', 'true');
            });
            overlay.classList.remove('show');
        };

        const isVisible = popUp.classList.contains('show') && !popUp.classList.contains('hide');
        if (isVisible) { hideAll(); return; }

        container.querySelectorAll('.pop-up').forEach(p => {
            if (p !== popUp) {
                p.classList.add('hide');
                p.classList.remove('show');
                p.setAttribute('aria-hidden', 'true');
            }
        });

        popUp.classList.remove('hide');
        popUp.classList.add('show');
        popUp.setAttribute('aria-hidden', 'false');
        overlay.classList.add('show');

        if (!overlay._handlerAttached) {
            overlay.addEventListener('click', () => hideAll());
            overlay._handlerAttached = true;
        }

        const closeBtn = popUp.querySelector('.close-button');
        if (closeBtn && !popUp._closeAttached) {
            closeBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                hideAll();
            });
            popUp._closeAttached = true;
        }

        if (!overlay._escAttached) {
            overlay._escHandler = ev => { if (ev.key === 'Escape') hideAll(); };
            window.addEventListener('keydown', overlay._escHandler);
            overlay._escAttached = true;
        }
    }


    #handleTableCols(sub_panel_id) {
        const panel = this.current_step.querySelector(`#${sub_panel_id}`);
        if (!panel) return;

        const table = panel.querySelector(".spec-table");
        if (!table) return;

        const rows = table.querySelectorAll("tr");

        // Find the column index by matching the header text
        const headerCells = table.querySelectorAll("thead th");
        const colIndex = Array.from(headerCells).findIndex(
            th => th.textContent.trim() === this.data_button
        );
        if (colIndex === -1) return;

        this.#disableAllRowsForCurrentColumn(rows);
        this.#enableSelectedColumn(rows, colIndex);
        this.#disableAllRowButtonForCurrentColumn(rows);


        table.querySelectorAll(".option-cell").forEach(option => {
            if (!option.dataset.listener) {
                option.dataset.listener = "true";
                option.addEventListener("click", () => {
                    this.#handleOptionButton(option, sub_panel_id, table);
                });
            }
        });
    }


    #handleOptionButton(option, sub_panel_id, table) {
        const cell = option.closest("td, th");
        if (!cell.classList.contains("column-highlight")) return;

        const variant = option.dataset.variant; // "Basis", "Standard", etc.
        const key = sub_panel_id + '-' + variant;
        const [bitOrder, bitSize] = this.bitindexes[key];
        const currentBits = this.selectors[sub_panel_id][2] ?? 0;

        // Find all options for this variant in the table
        const allVariantOptions = Array.from(
            table.querySelectorAll(`.option-cell[data-variant="${variant}"]`)
        );

        const bitIndex = allVariantOptions.indexOf(option);
        if (bitIndex === -1 || bitIndex >= bitSize) return;

        const mask = 1 << bitIndex;
        const newBits = currentBits ^ mask;
        this.selectors[sub_panel_id][2] = newBits;

        // --- NEW LOGIC ---
        const tr = option.closest("tr");
        const component = tr?.dataset.component;

        if (component) {
            // Exclusive selection: clear all other buttons in same component group
            const groupButtons = table.querySelectorAll(
                `tr[data-component="${component}"] .option-cell[data-variant="${variant}"]`
            );
            groupButtons.forEach(btn => {
                if (btn !== option) btn.classList.remove("selected");
            });
            option.classList.toggle("selected");
        } else {
            // Normal toggle
            option.classList.toggle("selected");
        }
        this.setProductBitValue(bitOrder, newBits, bitSize);
    }


    #enableSelectedColumn(rows, colIndex) {
        rows.forEach(row => {
            row.querySelectorAll("td, th").forEach((cell, i) => {
                if (i === colIndex) {
                    cell.classList.add("column-highlight");
                    cell.classList.remove("disabled");
                }
                if (i != colIndex && i != 0) {
                    cell.classList.add("column-disabled");
                }
            });
        });
    }

    #disableAllRowButtonForCurrentColumn(rows) {
        rows.forEach(row => {
            row.querySelectorAll("td, th").forEach((cell, i) => {
                const option = cell.querySelector(".option-cell");
                if (option && cell.classList.contains("column-disabled")) {
                    option.classList.remove("selected");
                    option.classList.add("disabled");
                }
            });
        });
    }

    #disableAllRowsForCurrentColumn(rows) {
        rows.forEach(row => {
            row.querySelectorAll("td, th").forEach((cell, i) => {
                cell.classList.remove("column-highlight", "column-disabled");
            });
        });
    }

    #updateVisionBasedReDresserServiceSpec() {
        this.vision_based_re_dresser_table.then(table => {
            const variant = this.selectors["Vision-Based-Re-Dresser"][0];
            const optionsBits = this.selectors["Vision-Based-Re-Dresser-Properties"][1] ?? 0;

            let bitIndex = 0; // increments only on optional rows
            this.ToolServiceSpecObject = Object.fromEntries(
                Array.from(table.querySelectorAll("tbody tr")).map(tr => {
                    const title = tr.querySelector(".title")?.textContent.trim();
                    const cell = tr.querySelector(`td[data-tag="${variant}"]`);
                    let value = cell?.textContent.trim() ?? "";

                    if (cell?.classList.contains("optional")) {
                        const mask = 1 << bitIndex; // LSB-first
                        value = (optionsBits & mask) !== 0 ? "✔" : "✘";
                        bitIndex++;
                    }

                    return [title, value]; // correct shape
                })
            );
            this.setProduct("Service", { "Vision-Based-for-Re-Dresser": this.ToolServiceSpecObject }, -1);
        });
    }

    #updateToolControlSpec() {
        this.tool_control_table.then(table => {
            const variant = this.selectors["Tool-Control"][0];
            const optionsBits = this.selectors["Tool-Control-Variant"][1] ?? 0;

            let bitIndex = 0; // increments only on optional rows
            this.ToolServiceSpecObject = Object.fromEntries(
                Array.from(table.querySelectorAll("tbody tr")).map(tr => {
                    const title = tr.querySelector(".title")?.textContent.trim();
                    const cell = tr.querySelector(`td[data-tag="${variant}"]`);
                    let value = cell?.textContent.trim() ?? "";

                    if (cell?.classList.contains("optional")) {
                        const mask = 1 << bitIndex; // LSB-first
                        value = (optionsBits & mask) !== 0 ? "✔" : "✘";
                        bitIndex++;
                    }

                    return [title, value]; // correct shape
                })
            );
            this.setProduct("Service", { "Tool-Control": this.ToolServiceSpecObject }, -1);
        });
    }


    #updateReDresserSpec() {
        this.re_dresser_table.then(table => {
            const variant = this.selectors["Re-Dresser"][0];
            const optionsBits = this.selectors["Re-Dresser-Properties"][1] ?? 0;

            let bitIndex = 0; // increments only on optional rows
            this.ReDresserSpecObject = Object.fromEntries(
                Array.from(table.querySelectorAll("tbody tr")).map(tr => {
                    const title = tr.querySelector(".title")?.textContent.trim();
                    const cell = tr.querySelector(`td[data-tag="${variant}"]`);
                    let value = cell?.textContent.trim() ?? "";

                    if (cell?.classList.contains("optional")) {
                        const mask = 1 << bitIndex; // LSB-first
                        value = (optionsBits & mask) !== 0 ? "✔" : "✘";
                        bitIndex++;
                    }

                    return [title, value]; // correct shape for fromEntries
                })
            );
            this.setProduct("Tools", { "Re-Dresser": this.ReDresserSpecObject }, -1);
        });
    }


    #handleCargoLoad() {
        this.#toggleButton();
        this.#toggleInfoText(this.sub_panel.id);
        this.#toggleCarrusel(this.selectors[this.sub_panel.id][1], this.sub_panel.id);
        if (this.selectors[this.sub_panel.id][1]) {
            this.#enableInfoText(this.selectors[this.sub_panel.id][0]);
            this.#clickAnyButton(this.selectors["Cargo-Load-Variants"][0], "Cargo-Load-Variants");
            this.setProductHeader({ "Tools": { "Cargo-Load": true } }, 1);
            this.#unlockPanel("sub-panel", "Cargo-Load-Variants");
        } else {
            this.#disableInfoText(this.selectors[this.sub_panel.id][0]);
            this.setProductToolFeatures("Cargo-Load™", "Cargo-Load™", "Cargo-Load", "Cargo-Load");
            this.setProductHeader({ "Tools": { "Cargo-Load": false } }, 0);
            this.removeProductFeatureTools(this.sub_panel.id);
            this.#lockPanel("sub-panel", "Cargo-Load-Variants");
        }
    }

    #handleCargoLoadVariants() {
        this.#selectExclusive();
        this.setSelectors("Cargo-Load-Variants", this.data_button, this.button_index + 1);
        this.#updateInfoText("Cargo-Load");
        this.setProductToolFeatures("Cargo-Load™", "Cargo-Load™", "Cargo-Load-Variants", "Cargo-Load");
    }

    #handleBulkDump() {
        this.#toggleButton();
        this.#toggleInfoText(this.sub_panel.id);
        this.#toggleCarrusel(this.selectors[this.sub_panel.id][1], this.sub_panel.id);
        if (this.selectors[this.sub_panel.id][1]) {
            this.#enableInfoText(this.selectors[this.sub_panel.id][0]);
            this.#clickAnyButton(this.selectors["Bulk-Dump-Variants"][0], "Bulk-Dump-Variants");
            this.setProductHeader({ "Tools": { "Bulk-Dump": true } }, 1);
            this.#unlockPanel("sub-panel", "Bulk-Dump-Variants");
        } else {
            this.#disableInfoText(this.selectors[this.sub_panel.id][0]);
            this.setProductToolFeatures("Bulk-Dump™", "Bulk-Dump™", "Bulk-Dump", "Bulk-Dump");
            this.setProductHeader({ "Tools": { "Bulk-Dump": false } }, 0);
            this.removeProductFeatureTools(this.sub_panel.id);
            this.#lockPanel("sub-panel", "Bulk-Dump-Variants");
        }
    }

    #handleBulkDumpVariants() {
        this.#selectExclusive();
        this.#updateInfoText("Bulk-Dump");
        this.setSelectors("Bulk-Dump-Variants", this.data_button, this.button_index + 1);
        this.setProductToolFeatures("Bulk-Dump™", "Bulk-Dump™", "Bulk-Dump-Variants", "Bulk-Dump")
    }



    #handleBeachCleaner() {
        this.#toggleButton();
        this.#toggleCarrusel(this.selectors[this.sub_panel.id][1], this.sub_panel.id);
        if (this.selectors[this.sub_panel.id][1]) {
            this.#enableInfoText(this.selectors[this.sub_panel.id][0]);
            this.#clickAnyButton(this.selectors["Beach-Cleaner-Variants"][0], "Beach-Cleaner-Variants");
            this.setProductHeader({ "Tools": { "Beach-Cleaner": true } }, 1);
            this.#unlockPanel("sub-panel", "Beach-Cleaner-Variants");
        } else {
            this.#disableInfoText(this.selectors[this.sub_panel.id][0]);
            this.setProductToolFeatures("Beach-Cleaner™", "Beach-Cleaner™", "Beach-Cleaner", "Beach-Cleaner");
            this.setProductHeader({ "Tools": { "Beach-Cleaner": false } }, 0);
            this.removeProductFeatureTools(this.sub_panel.id);
            this.#lockPanel("sub-panel", "Beach-Cleaner-Variants");
        }
    }

    #handleBeachCleanerVariants() {
        this.#selectExclusive();
        this.#updateInfoText("Beach-Cleaner");
        this.setSelectors("Beach-Cleaner-Variants", this.data_button, this.button_index + 1);
        this.setProductToolFeatures("Beach-Cleaner™", "Beach-Cleaner™", "Beach-Cleaner-Variants", "Beach-Cleaner")
    }

    #handleBulkAgro() {
        this.#toggleButton();
        this.#toggleInfoText(this.sub_panel.id);
        this.#toggleCarrusel(this.selectors[this.sub_panel.id][1], this.sub_panel.id);
        if (this.selectors[this.sub_panel.id][1]) {
            this.#enableInfoText(this.selectors[this.sub_panel.id][0]);
            this.#clickAnyButton(this.selectors["Bulk-Agro-Variants"][0], "Bulk-Agro-Variants");
            this.setProductHeader({ "Tools": { "Bulk-Agro": true } }, 1);
            // this.setProductToolFeatures("Bulk-Agro™", "Bulk-Agro™", "Bulk-Agro-Variants", "Bulk-Agro")
            this.#unlockPanel("sub-panel", "Bulk-Agro-Variants");
        } else {
            this.#disableInfoText(this.selectors[this.sub_panel.id][0]);
            this.setProductToolFeatures("Bulk-Agro™", "Bulk-Agro™", "Bulk-Agro", "Bulk-Agro")
            this.removeProductFeatureTools(this.sub_panel.id);
            this.setProductHeader({ "Tools": { "Bulk-Agro": false } }, 0);
            this.#lockPanel("sub-panel", "Bulk-Agro-Variants");
        }
    }

    #handleBulkAgroVariants() {
        this.#selectExclusive();
        this.#updateInfoText("Bulk-Agro");
        this.setSelectors("Bulk-Agro-Variants", this.data_button, this.button_index + 1);
        this.setProductToolFeatures("Bulk-Agro™", "Bulk-Agro™", "Bulk-Agro-Variants", "Bulk-Agro")

    }

    #handleToolBridge() {
        this.#toggleButton();
        this.#toggleInfoText(this.sub_panel.id);
        this.#toggleCarrusel(this.selectors[this.sub_panel.id][1], this.sub_panel.id);
        if (this.selectors[this.sub_panel.id][1]) {
            this.setProductRobotAccessories("Tool-Bridge™", "Tool-Bridge", "Tool-Bridge");
        } else {
            this.setProductRobotAccessories("Tool-Bridge™", "Tool-Bridge", "Tool-Bridge");
        }
    }


    #handleToolProcision() {
        this.#toggleButton();
        this.#toggleInfoText(this.sub_panel.id, null, this.selectors[this.sub_panel.id][1]);
        this.#toggleCarrusel(this.selectors[this.sub_panel.id][1], this.sub_panel.id);
        if (this.selectors[this.sub_panel.id][1]) {
            this.setProductRobotAccessories("Tool-Procision™", "Tool-Procision", "Tool-Procision");
        } else {
            this.setProductRobotAccessories("Tool-Procision™", "Tool-Procision", "Tool-Procision");
        }
    }


    #handleToolLiftAlign() {
        this.#toggleButton();
        this.#toggleInfoText(this.sub_panel.id);
        if (this.selectors[this.sub_panel.id][1]) {
            this.setProductRobotAccessories("Tool-LiftAlign™", "Tool-LiftAlign", "Tool-LiftAlign");
            this.#enableCarruselCard(this.sub_panel.id);
            this.#unlockPanel("sub-panel", "Tool-Procision");
            this.#unlockPanel("sub-panel", "Tool-Bridge");
            this.setProductRobotAccessories("Tool-Procision™", "Tool-Procision", "Tool-Procision");
            this.setProductRobotAccessories("Tool-Bridge™", "Tool-Bridge", "Tool-Bridge");
        } else {
            this.hideAllCarruselTypes("Tools");
            this.#lockPanel("sub-panel", "Tool-Procision");
            this.#lockPanel("sub-panel", "Tool-Bridge");
            this.setProductRobotAccessories("Tool-LiftAlign™", "Tool-LiftAlign", "Tool-LiftAlign");
        }

    }

    #handleDriveCab() {
        this.#toggleButton();
        this.#toggleInfoText(this.sub_panel.id);
        this.#toggleCarrusel(this.selectors[this.sub_panel.id][1], this.sub_panel.id);
        this.setProductRobotAccessories("Drive-Cab™", "Drive-Cab", "Drive-Cab");
        // if (this.selectors[this.sub_panel.id][1]) {
        //     this.setProductRobot(this.sub_panel.id, "✔");
        // } else {
        //     this.setProductRobot(this.sub_panel.id, "✘");
        // }
    }


    #handlePowerUnit() {
        this.#toggleButton();
        this.#toggleInfoText("Long-Range", "Basis", this.selectors[this.sub_panel.id][1]);
        if (this.selectors[this.sub_panel.id][1]) {
            this.#unlockPanel("sub-panel", "Power-Unit-Type");
            this.#enableCarruselCard(this.selectors["Power-Unit-Type"][0]);
            this.#enableInfoText(this.selectors[this.sub_panel.id][0], "Power-Unit");
            this.setProductRobotExtraEquipment("Power-Unit™", "Power-Unit-Type", "Power-Unit-Type");
            // this.setProduct(null, null, this.bitindexes["Power-Unit-Type"][0], this.selectors[this.sub_panel.id][1], this.bitindexes["Power-Unit-Type"][1]);
        } else {
            this.hideAllCarruselTypes(this.sub_panel.id);
            this.#disableInfoText(this.selectors["Power-Unit"][0], "Power-Unit");
            this.#lockPanel("sub-panel", "Power-Unit-Type");
            this.setProductRobotExtraEquipment("Power-Unit™", "Power-Unit", "Power-Unit-Type");
            this.removeProductFeature("Unit", this.sub_panel.id, this.bitindexes[this.sub_panel.id][0]);
            this.removeProductFeature("Unit", "Power-Unit-Type", this.bitindexes["Power-Unit-Type"][0]);
        }
    }

    #handlePowerUnitType() {
        this.#selectExclusive();
        this.#updateInfoText("Power-Unit");
        this.hideAllCarruselTypes("Power-Unit");
        this.#enableCarruselCard(this.data_button);
        this.setSelectors("Power-Unit-Type")
        this.setProductRobotExtraEquipment("Power-Unit™", "Power-Unit-Type", "Power-Unit-Type");
        // this.setProduct("Unit", { "Power-Unit": this.data_button }, this.bitindexes["Power-Unit-Type"][0], this.button_index, this.bitindexes["Power-Unit-Type"][1]);
    }

    #handleDrawBar() {
        this.#toggleButton();
        this.#toggleInfoText("Draw-Bar", null, this.selectors[this.sub_panel.id][1]);
        if (this.selectors[this.sub_panel.id][1]) {
            this.#enableCarruselCard(this.selectors["Draw-Bar-Control"][0]);
            this.#unlockPanel("sub-panel", "Draw-Bar-Control");
            this.setProductRobotExtraEquipment("Draw-Bar™", "Draw-Bar-Control", "Draw-Bar-Control");
        } else {
            this.hideAllCarruselTypes("Draw-Bar");
            this.#lockPanel("sub-panel", "Draw-Bar-Control");
            this.setProductRobotExtraEquipment("Draw-Bar™", "Draw-Bar", "Draw-Bar-Control");
            this.removeProductFeature("Unit", "Draw-Bar", this.bitindexes["Draw-Bar"][0]);
            this.removeProductFeature("Unit", "Draw-Bar-Control", this.bitindexes["Draw-Bar-Control"][0]);
        }
    }

    #handleDrawBarControl() {
        this.#selectExclusive();
        this.setSelectors()
        this.#updateInfoText();
        this.hideAllCarruselTypes("Draw-Bar");
        this.#enableCarruselCard(this.selectors[this.sub_panel.id][0]);
        this.setProductRobotExtraEquipment("Draw-Bar™", "Draw-Bar-Control", "Draw-Bar-Control");

    }

    #handleTrackTypes() {
        this.#selectExclusive();
        this.button_index += 10;
        this.setSelectors("Track-Types")
        this.#updateInfoText();
        this.hideAllCarruselTypes("wheel");
        this.showCarruselCard("GROUND-CONTACT");
        this.#activateCarruselCard("GROUND-CONTACT");
        this.saved_wheel[1] = "GROUND-CONTACT";
        this.setProductRobotEquipment("Track based", "Track-Types", "Track-Based");
    }

    #handleTyreTypes() {
        this.#selectExclusive();
        this.setSelectors("Tyre-Types");
        this.#updateInfoText();
        this.hideAllCarruselTypes("wheel");
        const family = Configurator.TYRE_MAP[this.data_button];
        if (!family) return;
        this.showCarruselCard(family);
        this.#activateCarruselCard(family);
        this.saved_wheel[0] = family;
        this.setProductRobotEquipment("Track based", "Tyre-Types", "Track-Based");
    }

    #getPanel(panelClass, panelId, step = this.current_step.id) {
        return this.steps[step].querySelector(`.${panelClass}#${panelId}`);
    }

    #unlockPanel(panelClass, panelId, step = this.current_step.id) {
        this.#getPanel(panelClass, panelId, step)?.classList.remove("hide");
    }

    #lockPanel(panelClass, panelId, step = this.current_step.id) {
        this.#getPanel(panelClass, panelId, step)?.classList.add("hide");
    }

    #togglePanel(panelClass, panelId, step = this.current_step.id, toggle = null) {
        if (toggle === null) {
            this.#getPanel(panelClass, panelId, step)?.classList.toggle("hide");
        } else {
            this.#getPanel(panelClass, panelId, step)?.classList.toggle("hide", !toggle);
        }
    }

    #isPanelUnlocked(panelClass, panelId, step = this.current_step.id) {
        const panel = this.#getPanel(panelClass, panelId, step);
        return panel ? !panel.classList.contains("hide") : false;
    }


    #selectExclusive() {
        const cells = Array.from(this.sub_panel.querySelectorAll(".content-cell"));
        cells.forEach(c => c.classList.remove("active"));
        this.cell.classList.add("active");
    }

    #toggleExclusive() {
        if (!this.sub_panel) {
            this.current_step.querySelectorAll(".product-feature-card.products.Configurator").forEach((card, i) => { card.classList.toggle("active", i === this.button_index); });
            return;
        }
        this.#selectExclusive();
    }

    #toggleSelector(feature) {
        if (!this.selectors[feature]) return;
        let current = this.selectors[feature][1];
        if (current === null) return;
        this.selectors[feature][0] = current === 1 ? "✘" : "✔";
        this.selectors[feature][1] = current === 1 ? 0 : 1;
    }


    #toggleSelectorMulti(feature, multi) {
        if (!this.selectors[feature]) return;
        let current = this.selectors[feature][multi];
        if (current === null) return;
        this.selectors[feature][multi] = !current;
    }


    #toggleButton(buttonname = this.sub_panel.id, multi = null) {
        if (multi == null) {
            this.#toggleSelector(buttonname);
            this.cell.classList.toggle("active", this.selectors[buttonname][1]);
        } else {
            this.#toggleSelectorMulti(buttonname, multi)
            this.cell.classList.toggle("active", this.selectors[buttonname][multi]);
        }
    }

    #updateInfoText(sub_panel = this.sub_panel.id, step = this.current_step.id) {
        const subPanelElem = this.steps[step]?.querySelector(`#${sub_panel}`);
        if (!subPanelElem) return;

        const group = subPanelElem.querySelector(".infobox-group");

        const texts = group
            ? group.querySelectorAll(".infobox-text")
            : this.sub_panel.querySelectorAll(".infobox-text");

        const clickedText = Array.from(texts).find(p => p.dataset.text === this.data_button);
        if (!clickedText) return;

        const type = clickedText.dataset.type || null;

        let anyActive = false;

        texts.forEach(p => {
            const pType = p.dataset.type || null;

            // Hvis elementen har data-type → match type-gruppe
            if (type && pType === type) {
                if (p.dataset.text === this.data_button) {
                    p.classList.add("active");
                    anyActive = true;
                } else {
                    p.classList.remove("active");
                }
            }

            // Hvis ingen data-type findes → klassisk fallback
            else if (!type) {
                if (p.dataset.text === this.data_button) {
                    p.classList.add("active");
                    anyActive = true;
                } else {
                    p.classList.remove("active");
                }
            }
        });

        if (group) {
            if (anyActive) {
                group.classList.add("active");
            } else {
                group.classList.remove("active");
            }
        }
    }

    #activateInfoText(key, sub_panel, step) {
        const stepContainer = this.steps[step];
        const subPanelElem = stepContainer?.querySelector(`#${sub_panel}`);
        if (!stepContainer || !subPanelElem) return;

        const group = subPanelElem.querySelector(".infobox-group");
        const root = group || subPanelElem;

        const texts = root.querySelectorAll(".infobox-text");
        const target = Array.from(texts).find(p => p.dataset.text === key);
        if (!target) return;
        target.classList.add("active");
    }


    #enableInfoText(key, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        const stepContainer = this.steps[step];
        const subPanelElem = stepContainer?.querySelector(`#${sub_panel}`);
        if (!stepContainer || !subPanelElem) return;

        const group = subPanelElem.querySelector(".infobox-group");
        const root = group || subPanelElem;

        const texts = root.querySelectorAll(".infobox-text");
        const target = Array.from(texts).find(p => p.dataset.text === key);
        if (!target) return;

        const type = target.dataset.type || null;
        let anyActive = false;

        texts.forEach(p => {
            const pType = p.dataset.type || null;
            if (type && pType === type) {
                if (p === target) {
                    p.classList.add("active");
                    anyActive = true;
                } else {
                    p.classList.remove("active");
                }
            }
            else if (!type && p === target) {
                p.classList.add("active");
                anyActive = true;
            }
        });

        if (group) {
            group.classList.toggle("active", anyActive);
        }
    }

    #disableInfoText(key, sub_panel = this.sub_panel.id, step = this.current_step.id) {
        const stepContainer = this.steps[step];
        const subPanelElem = stepContainer?.querySelector(`#${sub_panel}`);
        if (!stepContainer || !subPanelElem) return;

        const group = subPanelElem.querySelector(".infobox-group");
        const root = group || subPanelElem;

        const texts = root.querySelectorAll(".infobox-text");
        let anyActive = false;

        texts.forEach(p => {
            if (p.dataset.text === key) {
                p.classList.remove("active");
            }
            if (p.classList.contains("active")) {
                anyActive = true;
            }
        });

        if (group) {
            group.classList.toggle("active", anyActive);
        }
    }

    #toggleInfoText(
        enableKey,
        disableKey = null,
        state = this.selectors[this.sub_panel.id][1],
        sub_panel = this.sub_panel.id,
        step = this.current_step.id
    ) {
        const shouldEnable = this.#switch
            ? this.#switch(state, enableKey)
            : (state !== null ? !!state : true);

        if (disableKey) {
            if (shouldEnable) {
                this.#enableInfoText(enableKey, sub_panel, step);
                this.#disableInfoText(disableKey, sub_panel, step);
            } else {
                this.#enableInfoText(disableKey, sub_panel, step);
                this.#disableInfoText(enableKey, sub_panel, step);
            }
        }

        else {
            if (shouldEnable) {
                this.#enableInfoText(enableKey, sub_panel, step);
            } else {
                this.#disableInfoText(enableKey, sub_panel, step);
            }
        }
    }

    #switch(state, enable) {
        let toggler;
        if (state === null) {
            toggler = this.togglers[enable];
        } else {
            toggler = state;
        }
        return toggler;
    }


    #handleRobot() {
        if (!this.notEventBasedButton && this.#isButtonActive(this.data_button)) {
            this.setProductHeader({ "Robot": false }, 0);
            this.removeProductFeature("Type");
            this.#deactivateAnyButton(this.data_button);
        } else {
            this.setSelectors(this.sub_panel.id, this.data_button, this.button_index + 1);
            this.#selectExclusive();
            switch (this.data_button) {
                case "Ideal":
                    this.#handleIdeal();
                    break;
                case "Essential":
                    this.#handleEssential();
                    break;
                case "Premium":
                    this.#handlePremium();
                    break;
                default:
                    break;
            }
        }
    }

    #handleIdeal() {
        this.#lockPanel("sub-panel", "Module", "step-4");
        this.#lockPanel("sub-panel", "Power-Capacity", "step-5");
        this.#selectRobot();
    }

    #handleEssential() {
        this.#selectRobot();
    }

    #handlePremium() {
        this.#unlockPanel("sub-panel", "Module", "step-4");
        this.#unlockPanel("sub-panel", "Battery-Capacity", "step-5");
        this.#unlockPanel("sub-panel", "Power-Capacity", "step-5");
        this.#clickAnyButton(this.selectors["Configuration-Scope"][0], "Configuration-Scope", "step-5");
        this.#clickAnyButton(this.selectors["Power-Capacity"][0], "Power-Capacity", "step-5");
        this.#clickAnyButton(this.selectors["Battery-Capacity"][0], "Battery-Capacity", "step-5");
        this.#selectRobot();
    }

    #selectRobot() {
        this.#showSelectedImage('Robot', this.selectors.Model[0]);
        this.#showSelectedImageText('Robot', 'Robot', this.selectors.Model[0]);
        this.#unlockPanel("selection-panel", 'Robot', 'step-10');
        this.#unlockPanel("sub-panel", 'Subscription', 'step-10');
        this.setProductHeader({ Robot: true }, 1);
        this.setProductRobotFeatures("Model", "Model", "Model");
        this.#renameProduct("Re-Bot™ " + this.selectors.Model[0]);
    }

    #updateModuleHeader() {
        const titleEl = this.current_step.querySelector("#Module .section-title");
        if (titleEl) titleEl.textContent = `Module: ${this.data_button}`;
    }

    #handlePowerCapacity() {
        this.#selectExclusive();
        this.setSelectors("Power-Capacity");
        this.#updateInfoText();
        this.setProductRobotFeatures("Power capacity", "Power-Capacity", "Power-Capacity");
        this.setProductRobotFeatures("Linkage", "Linkage", "Linkage");
    }

    #handleBatteryCapacity() {
        this.#selectExclusive();
        this.setSelectors("Battery-Capacity");
        this.#updateRangeCapacity();
        this.setProductRobotFeatures("Battery capacity", "Battery-Capacity", "Battery-Capacity");
        this.setProductRobotFeatures("Linkage", "Linkage", "Linkage");
    }


    #handleLinkage() {
        this.#selectExclusive();
        this.setSelectors("Linkage");
        this.#updateInfoText();
        this.#updateInfoText("Tyre-Types", "step-6");
        this.#updateRangeCapacity();
        this.#updateRobotModuleImage();
        this.setProductRobotFeatures("Linkage", "Linkage", "Linkage");
        this.updateTyresDisplay();
    }

    #updateRangeCapacity() {
        const batteryCapacityPanel = this.steps["step-5"].querySelector("#Power-Capacity");
        if (!batteryCapacityPanel) return;

        const selectorText = `${this.selectors["Battery-Capacity"][0]}-${this.selectors.Linkage[0]}`;
        let anyRangeActive = false;

        batteryCapacityPanel.querySelectorAll(".infobox-text").forEach(element => {
            const type = element.dataset.type || null;

            if (type === "range") {
                if (element.dataset.text === selectorText) {
                    element.classList.add("active");
                    anyRangeActive = true;
                } else {
                    element.classList.remove("active");
                }
            }
        });
    }


    #handleModule() {
        this.setSelectors("Module");
        this.#selectExclusive();
        this.#updateInfoText();
        this.#updateInfoText("Tyre-Types", "step-6");
        if (this.selectors.Model[0] === "Premium") {
            this.#updateRobotModuleImage();
        }
        this.#unlockPanel("sub-panel", "Linkage");
        this.setProductRobotFeatures("Module", "Module", "Module");
        this.updateTyresDisplay();

    }

    updateTyresDisplay() {
        if (this.selectors.Module[0] === "Solo") {
            if (this.selectors.Branch[0] !== "Sport") {
                this.#showAllTyres();
            } else {
                this.#hideAllTyres();
                this.#showAnyButton("COUNTRY-KING-560", "Tyre-Types", "step-6");
                this.#showAnyButton("COUNTRY-KING-710", "Tyre-Types", "step-6");
            }
        }
        if (this.selectors.Module[0] === "Dual") {
            this.#hideBiggerTyres();
        }
        if (this.selectors.Linkage[0] === "Asymmetric-Duo") {
            this.#clickAnyButton("COUNTRY-KING-560", "Tyre-Types", "step-6");
            this.#activateAnyButton("COUNTRY-KING-560", "Tyre-Types", "step-6");
            this.#activateInfoText("COUNTRY-KING-560", "Tyre-Types", "step-6");
            this.#activateAnyButton("COUNTRY-KING-710", "Tyre-Types", "step-6");
            this.#activateInfoText("COUNTRY-KING-710", "Tyre-Types", "step-6");
        }
    }

    #updateRobotModuleImage() {
        const tyre = this.selectors.Module[0];
        const axle = this.selectors.Linkage[0];
        this.#showSelectedImage("Robot", this.selectors.Model[0] + '-' + tyre + '-' + axle);
    }

    #unlockImageCarrusel() {
        this.container.querySelector(".image-panel-carrusel")?.classList.contains("hide") &&
            this.container.querySelector(".image-panel-carrusel").classList.remove("hide");
    }

    #showSelectedImage(image_group, data_button = this.data_button) {
        if (this.notEventBasedButton) return;
        const container = this.image_panel_hero_container;
        if (!container) return;
        container.querySelectorAll('.image-panel-hero').forEach(c => c.classList.add('hide'));

        // Find the hero panel for the requested group and show it
        const hero = container.querySelector(`.image-panel-hero[data-image-group="${image_group}"]`);
        if (!hero) return;
        hero.classList.remove('hide');

        // Hide all images inside this hero
        const images = hero.querySelectorAll('.content-image');
        images.forEach(img => {
            img.classList.remove('active');
        });

        // Find the image to show (match alt attribute). Fallback to first image.
        let selected = hero.querySelector(`.content-image[alt="${data_button}"]`);
        if (!selected) selected = hero.querySelector('.content-image');

        if (selected) {
            // Un-hide and trigger fade-in
            selected.classList.add('active');
        }
    }


    #hideHeaderContainer() {
        this.container.querySelector(".product-container-header").classList.add("hide");
    }

    #showBodyContainer() {
        this.container.querySelector(".configurator-body-container").classList.remove("hide");
    }

    #showSelectedImageText(data_image_group, data_text, text = this.data_button) {
        if (this.notEventBasedButton) return;
        const hero = this.image_panel_hero_container
            ? this.image_panel_hero_container.querySelector(`.image-panel-hero[data-image-group="${data_image_group}"]`)
            : document.querySelector(`.image-panel-hero[data-image-group="${data_image_group}"]`);

        if (hero) {
            const span = hero.querySelector(`[data-text="${data_text}"]`);
            if (span) {
                span.textContent = text ?? "";
                return;
            }
        }
        const fallback = document.querySelector(`[data-text="${data_text}"]`);
        if (fallback) fallback.textContent = text ?? "";
    }
    #enableCarruselCard(identifier) {
        this.showCarruselCard(identifier);
        this.#activateCarruselCard(identifier);
    }

    #activateCarruselCard(identifier) {
        const card = this.#getCarruselCard(identifier);
        if (!card) return;

        const carousel = card.closest('.image-panel-carrusel');
        if (!carousel) return;

        // Fjern aktiv på alle kort i denne karrusel
        carousel
            .querySelectorAll('.card-wrapper')
            .forEach(c => c.classList.remove('active'));

        // Vis og aktiver det ønskede kort
        card.classList.remove('hide');
        card.classList.add('active');

        // ******** NYT: opdater header ud fra card.dataset.group ********
        const groupName = card.dataset.group;
        if (groupName) {
            const headers = carousel.querySelectorAll('.title[data-header]');
            headers.forEach(h => {
                const isActive = h.dataset.header === groupName;
                h.classList.toggle('hide', !isActive);
                h.classList.toggle('active', isActive);
            });
        }
        // ***************************************************************

        this.#centerCardInCarousel(card);
    }

    // Deactivate a carousel card
    deactivateCarruselCard(identifier) {
        const card = this.#getCarruselCard(identifier);
        if (card) card.classList.remove('active');
    }

    // Show a carousel card
    showCarruselCard(identifier) {
        const card = this.#getCarruselCard(identifier);
        if (card) card.classList.remove('hide');
    }

    #toggleCarrusel(state, id) {
        if (state) {
            this.#enableCarruselCard(id);
        } else {
            this.#hideCarruselCard(id);
        }
    }

    // Hide a carousel card
    #hideCarruselCard(identifier) {
        const card = this.#getCarruselCard(identifier);
        if (card) card.classList.add('hide');
    }

    // Helper to find card by alt text or index
    #getCarruselCard(identifier) {
        const cards = this.image_panel_carrusel_container.querySelectorAll('.card-wrapper');
        if (typeof identifier === 'number') return cards[identifier];
        return Array.from(cards).find(c => c.querySelector('img').alt === identifier);
    }

    hideAllCarruselTypes(types) {
        const cards = this.image_panel_carrusel_container.querySelectorAll('.card-wrapper');
        cards.forEach(card => {
            if (card.getAttribute('data-type') === types) {
                card.classList.add('hide');
            }
        });
    }

    #initCarousels() {
        const carousels = document.querySelectorAll('.image-panel-carrusel');

        carousels.forEach(carousel => {
            const container = carousel.querySelector('.container');
            const leftButtons = carousel.querySelectorAll('.left-button');
            const rightButtons = carousel.querySelectorAll('.right-button');

            const headerLeft = leftButtons[0] || null;
            const rowLeft = leftButtons[1] || leftButtons[0] || null;

            const headerRight = rightButtons[0] || null;
            const rowRight = rightButtons[1] || rightButtons[0] || null;

            const cards = Array.from(carousel.querySelectorAll('.card-wrapper'));

            const getVisibleCards = () =>
                cards.filter(c => !c.classList.contains('hide'));

            const headers = Array.from(
                carousel.querySelectorAll('.title[data-header]')
            );

            const groups = Array.from(
                new Set(
                    cards.map(c => c.dataset.group).filter(Boolean)
                )
            );

            let currentGroupIndex = 0;

            // ---------------------------
            //  HELPER: UPDATE HEADER TEXT
            // ---------------------------
            const updateHeaderForGroup = (groupName) => {
                if (!groupName) return;

                headers.forEach(h => {
                    const active = h.dataset.header === groupName;
                    h.classList.toggle('hide', !active);
                    h.classList.toggle('active', active);
                });

                const idx = groups.indexOf(groupName);
                if (idx !== -1) currentGroupIndex = idx;
            };

            // ---------------------------
            //  HELPER: SET ACTIVE GROUP
            // ---------------------------
            const setActiveGroup = (groupName) => {
                updateHeaderForGroup(groupName);

                const groupCards = cards.filter(c =>
                    c.dataset.group === groupName &&
                    !c.classList.contains('hide')
                );

                if (groupCards.length === 0) return;

                const first = groupCards[0];
                const visibleCards = getVisibleCards();

                visibleCards.forEach(c => c.classList.remove('active'));
                first.classList.add('active');

                activeIndex = visibleCards.indexOf(first);
                this.#centerCardInCarousel(first);
            };

            // ---------------------------------
            //  FIND OG SIKR ET AKTIVT STARTKORT
            // ---------------------------------
            let visibleCards = getVisibleCards();
            if (visibleCards.length === 0) return;

            let activeCard = visibleCards.find(c => c.classList.contains('active'));
            if (!activeCard) {
                activeCard = visibleCards[0];
                activeCard.classList.add('active');
            }

            let activeIndex = visibleCards.indexOf(activeCard);

            // ---------------------------------
            //  HELPER: UPDATE ACTIVE CARD
            // ---------------------------------
            const updateActive = (newIndex) => {
                visibleCards = getVisibleCards();
                if (visibleCards.length === 0) return;

                visibleCards.forEach(card => card.classList.remove('active'));

                const newActive = visibleCards[newIndex];
                if (!newActive) return;

                newActive.classList.add('active');
                activeIndex = visibleCards.indexOf(newActive);

                // *** NYT = HEADER SKIFTER LIVE ***
                const groupName = newActive.dataset.group;
                updateHeaderForGroup(groupName);

                this.#centerCardInCarousel(newActive);
            };

            // ---------------------------------
            //  NÆSTE / FORRIGE INDEX
            // ---------------------------------
            const getNextIndex = (direction) => {
                visibleCards = getVisibleCards();
                if (visibleCards.length === 0) return -1;

                if (activeIndex < 0 || activeIndex >= visibleCards.length) {
                    activeIndex = 0;
                }

                let idx = activeIndex;

                if (direction === 'left') {
                    idx--;
                    if (idx < 0) idx = visibleCards.length - 1;
                } else {
                    idx++;
                    if (idx >= visibleCards.length) idx = 0;
                }

                return idx;
            };

            // ---------------------------------
            //  NEDERSTE PILE
            // ---------------------------------
            if (rowLeft) {
                rowLeft.addEventListener('click', () => {
                    const newIndex = getNextIndex('left');
                    if (newIndex !== -1) updateActive(newIndex);
                });
            }

            if (rowRight) {
                rowRight.addEventListener('click', () => {
                    const newIndex = getNextIndex('right');
                    if (newIndex !== -1) updateActive(newIndex);
                });
            }

            // ---------------------------------
            //  CLICK PÅ KORT
            // ---------------------------------
            cards.forEach(card => {
                card.addEventListener('click', () => {
                    if (card.classList.contains('hide')) return;

                    visibleCards = getVisibleCards();
                    const idx = visibleCards.indexOf(card);

                    if (idx !== -1) updateActive(idx);
                });
            });

            // ---------------------------------
            //  GROUP NAVIGATION (HEADER-PILENE)
            // ---------------------------------
            if (groups.length > 0) {
                setActiveGroup(groups[currentGroupIndex]);
            }

            const gotoPrevGroup = () => {
                if (groups.length < 2) return;
                currentGroupIndex--;
                if (currentGroupIndex < 0) currentGroupIndex = groups.length - 1;
                setActiveGroup(groups[currentGroupIndex]);
            };

            const gotoNextGroup = () => {
                if (groups.length < 2) return;
                currentGroupIndex++;
                if (currentGroupIndex >= groups.length) currentGroupIndex = 0;
                setActiveGroup(groups[currentGroupIndex]);
            };

            if (headerLeft) headerLeft.addEventListener('click', gotoPrevGroup);
            if (headerRight) headerRight.addEventListener('click', gotoNextGroup);

            // ---------------------------------
            //  TOUCH / SWIPE SUPPORT
            // ---------------------------------
            let startX;
            let isDragging = false;

            container.addEventListener('touchstart', e => {
                startX = e.touches[0].clientX;
                isDragging = true;
            });

            container.addEventListener('touchmove', e => {
                if (!isDragging) return;

                const x = e.touches[0].clientX;
                const diff = startX - x;

                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        if (rowRight) rowRight.click();
                    } else {
                        if (rowLeft) rowLeft.click();
                    }
                    isDragging = false;
                }
            });

            container.addEventListener('touchend', () => {
                isDragging = false;
            });
        });
    }


    #centerCardInCarousel(card) {
        if (!card) return;
        const carousel = card.closest('.image-panel-carrusel');
        if (!carousel) return;

        const container = carousel.querySelector('.container');
        if (!container) return;

        // Brug boundingClientRect + scrollLeft for robust centering
        const containerRect = container.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();

        const cardCenterInContainer =
            (cardRect.left - containerRect.left) + cardRect.width / 2;

        const targetScrollLeft =
            cardCenterInContainer - container.clientWidth / 2 + container.scrollLeft;

        container.scrollTo({
            left: targetScrollLeft,
            behavior: 'smooth'
        });
    }

}