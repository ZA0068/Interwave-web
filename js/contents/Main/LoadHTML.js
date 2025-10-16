import LoadHTMLContainer from '/js/components/LoadHTMLContainer.js';
const app = new LoadHTMLContainer();

app.add('#Header', '/html/components/Header.html');
app.add('#Footer', '/html/components/Footer.html');
app.run();
