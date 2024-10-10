// Code: party/index.js
// Using partykit, we can create a simple server that will handle the game logic and communication with the clients.

export default class WebSocketServer {
  constructor(room) {
    this.room = room;
  }
  // when a client sends a message
  onMessage(message, sender) {
    const [type, ...data] = JSON.parse(message);

    if (type === 'ready') {
      sender.send(JSON.stringify(['init', connection.id, connection.state.side]));
    }

    // send it to everyone else
    this.room.broadcast(message, [sender.id]);
  }
  // when a new client connects
  onConnect(connection) {
    // disconnect if over capacity
    const playerCount = [...this.room.getConnections()].length;
    if (playerCount > 2) {
      connection.send(JSON.stringify(['full']));
      connection.close();
      console.log('room is full', this.users.length);
      return;
    }
    connection.setState({ side: playerCount>1 ? 'right' : 'left' });
    
    connection.send(JSON.stringify(['init', connection.id, connection.state.side]));
    this.room.broadcast(JSON.stringify(['join', connection.id]), [connection.id]);
  }
  // when a client disconnects
  onClose(connection) {
    this.room.broadcast(JSON.stringify(['leave', connection.id]), [connection.id]);
  }
}


