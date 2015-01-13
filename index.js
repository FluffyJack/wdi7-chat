var httpServer = require('http').createServer(handler),
    wsServer = require('socket.io')(httpServer),
    fs = require('fs');

httpServer.listen(process.env.PORT || 8080)

function handler(req, res) {
  fs.readFile(__dirname + "/client/index.html", function(err, data) {
    if (err) {
      res.writeHead(500);
      return res.end("Error loading home page");
    }

    res.writeHead(200);
    res.end(data);
  });
}

var commands = {
  "joinroom": function(connection, params) {
    connection.join(params[0]);
    connection.emit("Joined " + params[0]);
    wsServer.to(params[0]).emit("messages", { message: (connection.username || "Someone") + " joined the room" });
  },
  "username": function(connection, params) {
    connection.username = params[0];
    connection.emit("messages", { message: "Username changed to " + params[0] });
  }
}

wsServer.on("connection", function(connection) {
  connection.emit("info", { status: "connected" });

  connection.on("info", function(data) {
  });

  connection.on("commands", function(data) {
    commands[data.command](connection, data.params);
  });

  connection.on("messages", function(data) {
    if ( connection.rooms.length > 1 ) {
      connection.rooms.filter(function(el) { return connection.id !== el }).forEach(function(room) {
        data.username = connection.username;
        wsServer.to(room).emit("messages", data);
      });
    } else {
      connection.emit("messages", { message: "You're not in a room, use /joinroom to join one" });
    }
  });
});
