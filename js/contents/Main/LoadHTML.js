import LoadHTMLContainer from '/js/components/LoadHTMLContainer.js';
const app = new LoadHTMLContainer();
<<<<<<< HEAD
app.addHTML('#Header', '/html/components/Header.html');
app.addHTML('#LogOut', '/html/components/logoutbutton.html');
app.addHTML('#Footer', '/html/components/Footer.html');
app.addJS('/js/components/SessionManager.js');
app.addJS('/js/components/login.js');
=======

app.add('#Header', '/html/components/Header.html');
app.add('#Footer', '/html/components/Footer.html');
>>>>>>> parent of 71f2a9b (init)
app.run();
