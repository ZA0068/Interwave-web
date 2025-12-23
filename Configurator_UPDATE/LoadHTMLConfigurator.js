import LoadHTMLContainer from "./load-html-container.js";
import { Configurator } from "./Configurator.js";

const loader = new LoadHTMLContainer();

loader.insertHTML("#Re-Bot-Table", "./Re-Bot-Table.html");
loader.insertHTML("#Re-Dresser-Table", "./Re-Dresser-Table.html");
loader.insertHTML("#Tool-Control-Tools-Table", "./Tool-Control-Tools-Table.html");
loader.insertHTML("#Vision-Based-Table", "./Vision-Based-Table.html");
loader.insertHTML("#Vision-Based-Tools-Table", "./Vision-Based-Tools-Table.html");
loader.insertHTML("#Table-Pop-Up", "./Table-Pop-Up.html");

loader.addJavaScript("./scripts.js");
loader.run().then(() => {
        const configurator = new Configurator();
        configurator.run();
});
