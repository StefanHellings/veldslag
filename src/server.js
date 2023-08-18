// Simple 2 player card game server using socket.io and express
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = 3000;

let players = [];

io.on('connection', socket => {
    console.log('a user connected', socket.id);

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('player', player => {
        players.push(player);
        console.log(players);
    });
});

// Serve the index.html file located in src/index.html to the client
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

// Serve the static files located in src/js to the client
app.use('/js', express.static(__dirname + '/js'));

// Serve the static files located in src/dist to the client
app.use('/dist', express.static(__dirname + '/dist'));

// Start the server on port 3000
server.listen(port, () => console.log(`Example app listening on port ${port}! - http://localhost:${port}`));
