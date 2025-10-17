import LoadHTMLContainer from '/js/components/LoadHTMLContainer.js';
const app = new LoadHTMLContainer();

app.addHTML('#Header', '/html/components/Header.html');
app.addHTML('#Footer', '/html/components/Footer.html');
app.run();
