import express from "express";
import { Server } from "socket.io";
import http from "http";
import { Chess } from "chess.js";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "console";
import { disconnect } from "process";
import { Socket } from "dgram";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (unqiueSocket) {
  console.log("Connected");

  if (!players.white) {
    players.white = unqiueSocket.id;
    unqiueSocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = unqiueSocket.id;
    unqiueSocket.emit("playerRole", "b");
  } else unqiueSocket.emit("spectatoRole");

  unqiueSocket.on("disconnect", function () {
    if (unqiueSocket.id === players.white) {
      delete players.white;
    } else if (unqiueSocket.id === players.black) {
      delete players.black;
    }
  });

  unqiueSocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && unqiueSocket.id !== players.white) return;
      if (chess.turn() === "b" && unqiueSocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen()); // sabko board ki current state mill jaye gi
      } else {
        console.log("Invalid Move: ", move);
        unqiueSocket.emit(move);
      }
    } catch (error) {
      console.log(error);
      unqiueSocket.emit("Invalid move: ", move);
    }
  });
});

server.listen(3000, () => {
  console.log("Server is running on the port 3000");
});
