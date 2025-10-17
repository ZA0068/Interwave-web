import LoadHTMLContainer from '/js/components/LoadHTMLContainer.js';
const app = new LoadHTMLContainer();
app.addHTML('#Header', '/html/components/Header.html');
app.addHTML('#LogOut', '/html/components/logoutbutton.html');
app.addHTML('#Footer', '/html/components/Footer.html');
app.addJS('/js/components/SessionManager.js');
app.addJS('/js/components/login.js');
app.run();
