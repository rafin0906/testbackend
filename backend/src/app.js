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

// mount API routes


// error handler (last)


export default app