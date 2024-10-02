// Code: party/index.js
// Using partykit, we can create a simple server that will handle the game logic and communication with the clients.

export default class WebSocketServer {
  constructor(room) {this.room = room;this.users=[];}
  // when a client sends a message
  onMessage(message, sender) {
    // send it to everyone else
    this.room.broadcast(message, [sender.id]);
  }
  // when a new client connects
  onConnect(connection) {
    // disconnect if over capacity
    if (this.users.length >= 3) {
      connection.send(['full']);
      connection.close();
      console.log('room is full', this.users.length);
      return;
    }
    this.users.push(connection);
    this.room.broadcast(['join', connection.id], [connection.id]);
  }
  // when a client disconnects
  onClose(connection) {
    this.users = this.users.filter(user => user.id !== connection.id);
    this.room.broadcast(['leave', connection.id], [connection.id]);
  }
}


