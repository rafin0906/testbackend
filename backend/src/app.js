import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

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


export default app