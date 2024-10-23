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
      console.log('ready', sender.state);
      sender.send(JSON.stringify(['init', sender.id, sender.state.side]));
    }
    if (type === 'ping') {
      sender.send(JSON.stringify(['pong', ...(this.room.getConnections().map(c => c.id))]));
      return;
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
      console.log('room is full', playerCount);
      return;
    }
    this.updateSides();
    this.room.broadcast(JSON.stringify(['join', connection.id]), [connection.id]);
  }
  // when a client disconnects
  onClose(connection) {
    this.updateSides();
    this.room.broadcast(JSON.stringify(['leave', connection.id]), [connection.id]);
  }
  updateSides() {
    const connections = [...this.room.getConnections()];
    if (connections.length === 0) return;
    console.log('update sides', connections.map(c => c.id));
    const first = connections[0].state?.side;
    const second = connections[1]?.state?.side;
    // assign sides
    if (!first && !second) {
      connections[0].setState({ side: 'left'});
      connections[0].send(JSON.stringify(['init', connections[0].id, connections[0].state.side]));
      try {
        connections[1].setState({ side: 'right'});
        connections[1].send(JSON.stringify(['init', connections[1].id, connections[1].state.side]));
      } catch (e) {
        console.error(e);
      }
    }
    if (connections.length < 2) return;
    if (first && !second) {
      connections[1].setState({ side: first === 'left' ? 'right' : 'left'});
      connections[1].send(JSON.stringify(['init', connections[1].id, connections[1].state.side]));
    }
    if (!first && second) {
      connections[0].setState({ side: second === 'left' ? 'right' : 'left'});
      connections[0].send(JSON.stringify(['init', connections[0].id, connections[0].state.side]));
    }
  }
}