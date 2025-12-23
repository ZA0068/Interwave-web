export const IMAGES = {
        "Re-Bot-Ideal": ["./public/Re-Bot/Re-Bot Ideal.png", 250, 207],
        "Re-Bot-Essential": ["./public/Re-Bot/Re-Bot Essential.png", 487, 350],
        "Re-Bot-Logo": ["./public/Logo/Re-Bot_BG.png", 640, 182],
        "Re-Dresser-Logo": ["./public/Logo/Re-Dresser_GB.png", 816, 176],
        "Re-Bot-Premium": ["./public/Re-Bot/Re-Bot Premium Dual - Duo.png", 1400, 575],
        "Re-Bot-Premium-Solo-Single": ["./public/Re-Bot/Re-Bot Premium Solo - Single.png", 1365, 768],
        "Re-Bot-Premium-Solo-Duo": ["./public/Re-Bot/Re-Bot Premium Solo - Duo.png", 1400, 575],
        "Re-Bot-Premium-Dual-Single": ["./public/Re-Bot/Re-Bot Premium Dual - Single.png", 1137, 674],
        "Re-Bot-Premium-Dual-Duo": ["./public/Re-Bot/Re-Bot Premium Dual - Duo.png", 1400, 575],
        "Re-Bot-Premium-Asymmetric-Duo": ["./public/Re-Bot/Dual and Single.png", 1484, 802],
        "Re-Dresser-Premium-3.0": ["./public/Re-Dresser/Re-Dresser Premium 3.0.PNG", 1256, 685],
        "Re-Dresser-Premium-3.0-Draw-Bar": ["./public/Re-Dresser/Re-Dresser Premium 3.0 w. Draw-Bar & Rear Axle.png", 1658, 698],
        "Re-Dresser-Re-Bot-Asymmetric-Duo": ["./public/Re-Dresser/Re-Dresser with Re-Bot Asymmetric Duo.png", 1717, 752],
        "Bulk-Dump": ["./public/Re-Bot/Re-Bot Premium Dual - Duo.png", 0, 0],
        "Bulk-Agro": ["./public/Re-Bot/Re-Bot Premium Dual - Duo.png", 0, 0],
        "Cargo-Load": ["./public/Re-Bot/Cargo-Load.png", 1623, 534],
        default: ["", 0, 0],
};



export const EXPORTTYPE = {
        Order: 0,
        Offer: 1,
};

export const SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$@';


export const buttonColorMap = {
        background: {
                Agro: [124, 252, 0],           // lawngreen
                Sport: [0, 0, 0],              // black
                Airport: [255, 255, 0],        // yellow
                Entrepeneur: [255, 165, 0],    // orange
                Defence: [85, 107, 47],        // darkolivegreen
                NGO: [255, 255, 255],          // white
        },
        text: {
                Agro: [0, 0, 0],               // black
                Sport: [255, 255, 255],        // white
                Airport: [255, 255, 255],      // white
                Entrepeneur: [0, 0, 0],        // black
                Defence: [0, 0, 0],            // black
                NGO: [0, 0, 0],                // black
        }
};


export const FeaturesNames = {
        "Brand": "Our product",
        "Re-Bot": "Re-Bot™",
        "Model": "Model",
        "Power-Capacity": "Power capacity",
        "Linkage": "Linkage",
        "Colors": "Color",
        "Branch-Variants": "Branch variant",
        "Re-Bot Variant": "Robot variant",
        "Flex-Drive": "Flex-Drive (CTI)",
        "Ground contact": "Ground contact",
        "Track-Based": "Wheel type",
        "Power-Unit": "Power Unit",
        "Draw-Bar": "Draw-Bar™",
        "Tool-LiftAlign": "Tool-LiftAlign™",
        "Tool-Bridge": "Tool-Bridge™",
        "Tool-Procision": "Tool-Procision™",
        "Tool-Procision": "Drive-Cab™",
        "Vision-Based": "Vision-Based",
        "Subscription": "Subscription",
}

//------------------------------------------------------
//  RAL-farvekatalog (udvalg af relevante industri-farver)
//  • Standardiseret i fysisk produktion
//  • HEX bruges som digital visning
//------------------------------------------------------
export const RAL_COLORS = {
        // Greens (Agricultural / Military / Municipal)
        "RAL 6010": { hex: "#4C6F28", name: "Grass Green" },
        "RAL 6005": { hex: "#08422D", name: "Moss Green" },
        "RAL 6024": { hex: "#008754", name: "Traffic Green" },
        "RAL 6031": { hex: "#4A5D23", name: "Military Green" },

        // Yellows (Airport / Safety / Visibility)
        "RAL 1023": { hex: "#F7B500", name: "Traffic Yellow" },
        "RAL 1003": { hex: "#F2A800", name: "Signal Yellow" },

        // Oranges (Construction / Entrepeneur)
        "RAL 2003": { hex: "#FF7514", name: "Pastel Orange" },
        "RAL 2004": { hex: "#F44611", name: "Pure Orange" },

        // Greys / Neutrals
        "RAL 7035": { hex: "#D4D4D4", name: "Light Grey" },
        "RAL 7013": { hex: "#6C695B", name: "Brown Grey" },

        // Blacks & whites
        "RAL 9005": { hex: "#0A0A0A", name: "Jet Black" },
        "RAL 9003": { hex: "#F4F4F4", name: "Signal White" },
};

//------------------------------------------------------
// HEX → RGB converter
//------------------------------------------------------
export function hexToRgb(hex) {
        hex = hex?.replace("#", "");
        return hex && hex.length === 6
                ? {
                        r: parseInt(hex.substring(0, 2), 16),
                        g: parseInt(hex.substring(2, 4), 16),
                        b: parseInt(hex.substring(4, 6), 16),
                }
                : null;
}

//------------------------------------------------------
// Find nærmeste RAL baseret på digital HEX (24-bit farve)
// Bruger simpel Euclidean RGB distance
//------------------------------------------------------
export function findNearestRAL(hexColor) {
        const input = hexToRgb(hexColor);
        if (!input) return null;

        let bestMatch = null;
        let minDistance = Infinity;

        for (const [code, data] of Object.entries(RAL_COLORS)) {
                const ralRgb = hexToRgb(data.hex);
                const distance =
                        Math.pow(input.r - ralRgb.r, 2) +
                        Math.pow(input.g - ralRgb.g, 2) +
                        Math.pow(input.b - ralRgb.b, 2);

                if (distance < minDistance) {
                        minDistance = distance;
                        bestMatch = { code, ...data };
                }
        }
        return bestMatch; // {code:"RAL 6010", hex:"#4C6F28", name:"Grass Green"}
}

//------------------------------------------------------
// Eksporter valgte farver (klar til tilbud / ordre / PDF)
//------------------------------------------------------
export function exportColorSelection(mainHex, subHex) {
        const mainRAL = findNearestRAL(mainHex);
        const subRAL = findNearestRAL(subHex);

        return {
                hexMain: mainHex,
                hexSub: subHex,
                RALMain: mainRAL?.code || null,
                RALSub: subRAL?.code || null,
                RALMainName: mainRAL?.name || null,
                RALSubName: subRAL?.name || null,
        };
}


// export const APICALL = {
//         OFFER_ADMIN_LOGIN: "http://re-mac.local/Excellent-Edition/auth.php",
//         FETCH_ALL: "http://re-mac.local/Excellent-Edition/offer_handler.php?action=getAll",
//         STORE_2_OFFER: "http://re-mac.local/Excellent-Edition/offer_handler.php?action=addOffer",
//         DELETE_OFFER: "http://re-mac.local/Excellent-Edition/offer_handler.php?action=removeOffer",
//         LOGIN: "http://re-mac.local/Login-Portal/UserLogin.php",
//         REGISTER: "http://re-mac.local/Login-Portal/Register-Organization.php",
// }


export const APICALL = {
        FETCH_ALL: "/offer_control/offer?action=getAll",
        STORE_2_OFFER: "/offer_control/offer?action=addOffer",
        DELETE_OFFER: "/offer_control/offer?action=removeOffer",
        OFFER_ADMIN_LOGIN: "/offer_control/auth",
        LOGIN: "/Login",
        REGISTER: "/Register",
};


export function amLoggedIn() {
        return fetch('/Check_Session', {
                method: 'GET',
                credentials: 'include'
        })
                .then(res => res.json())
                .then(data => !!data.loggedIn)
                .catch(() => false);
}