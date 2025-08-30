import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

const app = express();
const port = process.env.PORT;

app.get('/', (req, res) => {
  res.send('Hello World!')
})


//create a array of jokes objects with id title
const jokes = [
  {
    id: 1,
    title: "Why don't scientists trust atoms?",
    punchline: "Because they make up everything!"
  },
  {
    id: 2,
    title: "Why did the scarecrow win an award?",
    punchline: "Because he was outstanding in his field!"
  },
  {
    id: 3,
    title: "Why don't skeletons fight each other?",
    punchline: "They don't have the guts!"
  }
];

app.get("/api/jokes", (req,res) => {
  res.send(jokes);
}
)

app.listen(port, () => {
  console.log(`🟢🟢 Example app listening on port ${port}`)
})
