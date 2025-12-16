import LoadHTMLContainer from "/js/components/load-html-container.js";
import { Configurator } from "/js/contents/Configurator/Configurator.js";

const loader = new LoadHTMLContainer();

loader.insertHTML("#language-button", "/html/components/language-button.html");
loader.insertHTML("#configurator-header-container", "/html/contents/Configurator/configurator-header-container.html");
loader.insertHTML("#header-title", "/html/contents/Configurator/configurator-header-container/header-title.html", "/html/contents/Configurator/configurator-header-container.html");
loader.insertHTML("#header-steps", "/html/contents/Configurator/configurator-header-container/header-steps.html", "/html/contents/Configurator/configurator-header-container.html");
loader.insertHTML("#configurator-body-container", "/html/contents/Configurator/configurator-body-container.html");

loader.insertHTML("#image-panel-container", "/html/contents/Configurator/configurator-body-container/image-panel-container.html");
loader.insertHTML("#Image-Panel-Hero-Container", "/html/contents/Configurator/configurator-body-container/image-panel-container/hero.html", "/html/contents/Configurator/configurator-body-container/image-panel-container.html");
loader.insertHTML("#Image-Panel-Carrusel-Container", "/html/contents/Configurator/configurator-body-container/image-panel-container/carrusel.html", "/html/contents/Configurator/configurator-body-container/image-panel-container.html");

loader.insertHTML("#configuration-panel-container", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");

loader.insertHTML("#step-0", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-0.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-1", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-1.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-2", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-2.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-3", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-3.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-4", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-4.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-5", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-5.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-6", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-6.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-7", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-7.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-8", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-8.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-9", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-9.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-10", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-10.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");
loader.insertHTML("#step-11", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-11.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container.html");

loader.insertHTML("#Ideal", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/Product-Feature-Cards/Ideal.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-0.html");
loader.insertHTML("#Essential", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/Product-Feature-Cards/Essential.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-0.html");
loader.insertHTML("#Premium", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/Product-Feature-Cards/Premium.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-0.html");
loader.insertHTML("#Program", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/Product-Feature-Cards/Program.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-0.html");

loader.insertHTML("#configurator-contactform-container", "/html/contents/Configurator/configurator-contactform-container.html");
loader.insertHTML("#User", "/html/contents/Configurator/Contact-Forms/User.html", "/html/contents/Configurator/configurator-contactform-container.html");
loader.insertHTML("#Customer", "/html/contents/Configurator/Contact-Forms/Customer.html", "/html/contents/Configurator/configurator-contactform-container.html");
loader.insertHTML("#Visitor", "/html/contents/Configurator/Contact-Forms/Visitor.html", "/html/contents/Configurator/configurator-contactform-container.html");
loader.insertHTML("#Business-Case", "/html/contents/Configurator/Contact-Forms/Business-Case.html", "/html/contents/Configurator/configurator-contactform-container.html");


loader.insertHTML("#Re-Bot-Table", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/Tables/Re-Bot-Table.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-3.html");


loader.insertHTML("#Re-Dresser-Table", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/Tables/Re-Dresser-Table-Select.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-6.html");
loader.insertHTML("#Table-Pop-Up", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/Tables/Table-Pop-Up.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-6.html");

loader.insertHTML("#Vision-Based-Table", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/Tables/Vision-Based-Table.html", "/html/contents/Configurator/configurator-body-container/configuration-panel-container/step-8.html");


loader.addJavaScript("/js/components/scripts.js");
loader.run().then(() => {
        const configurator = new Configurator();
        configurator.run();
});
