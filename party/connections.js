export default class WebSocketServer {

  constructor(room) {
    this.room = room;
  }
  // when a client sends a message
  async onMessage(message, sender) {
    const [type, ...data] = JSON.parse(message);
    // get room ids from storage
    this.rooms = this.rooms ?? await this.room.storage.get('rooms');
    if (type === 'find') {
      // select a room randomly
      let room = this.rooms[Math.floor(Math.random() * this.rooms.length)];

      sender.send(JSON.stringify(['room', room]));
    }
    if (type === 'check') {
      // check if room is open
      let open = this.rooms.includes(data[0]);
      sender.send(JSON.stringify(['open', open]));
    }
    if (type === 'update') {
      if (data[0] === 'open') {
        this.rooms.push(data[1]);
      }
      if (data[0] === 'close') {
        this.rooms = this.rooms.filter(r => r !== data[1]);
      }
      this.room.storage.set('rooms', this.rooms);
    }
  }
}


