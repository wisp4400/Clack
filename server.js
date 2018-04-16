const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cookieParser = require('cookie-parser');
const chat = require('./chat/chat')(io);

app.use(cookieParser());

// Do not tell the browsers of server information
app.disable('x-powered-by'); 

// Use port 80 or a specified port
app.set('port', process.env.PORT || 80);

app.get('/', function(req, res) {
    res.send("Main page!");
});

// Use the chat application at '/chat'
app.use('/chat', chat);

// Static serve 'public' folder
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
    console.log("Client attempted to access " + req.url);
    res.status(404);
    res.send('404');

});

app.use(function(err, req, res, next) {
    console.error("Server Error: " + err);
    console.error(err.stack);
    res.status(500);
    res.send('500');

});

http.listen(app.get('port'), function() {
    console.log("Server started on port " + app.get('port'));
});
