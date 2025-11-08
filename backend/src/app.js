import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

const app = express();

const __dirname = path.resolve();

app.use(cors({ 
    origin: process.env.CORS_ORIGIN || "*" ,
    credentials: true,
}));

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true,limit: '10mb' }));
app.use(express.static("public"));

app.use(cookieParser());



// routes import
import gameRoomRouter from "./routes/gameRoom.route.js";


// routes deeclaration
app.use("/api/v1/rooms", gameRoomRouter);

app.use(express.static(path.join(__dirname, '/frontend/dist')));
app.get('*', (_, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
});


export default app