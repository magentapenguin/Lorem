// Code: party/index.js
// Using partykit, we can create a simple server that will handle the game logic and communication with the clients.

export default class WebSocketServer {
  constructor(room) {}
  // when a client sends a message
  onMessage(message, sender) {
    // send it to everyone else
    this.room.broadcast(message, [sender.id]);
  }
  // when a new client connects
  onConnect(connection) {
    // welcome the new joiner
    connection.send(`Welcome, ${connection.id}`);
    // let everyone else know that a new connection joined
    this.room.broadcast(`Heads up! ${connection.id} joined the party!`, [
      connection.id
    ]);
  }
  // when a client disconnects
  onClose(connection) {
    this.room.broadcast(`So sad! ${connection.id} left the party!`);
  }
}


