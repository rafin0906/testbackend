

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    // example events
    socket.on("joinRoom", (payload) => {
      // call controller/service to handle join, e.g. gameRoomController.join(payload, socket, io)
    });

    socket.on("disconnect", (reason) => {
      console.log("socket disconnected:", socket.id, reason);
    });
  });
}