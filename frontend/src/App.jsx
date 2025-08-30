import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";

const App = () => {

  const [jokes, setjokes] = useState([]);


  useEffect(() => {
    axios.get("/api/jokes")
      .then((res) => {
        setjokes(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Jokes UI</h1>
      {

        jokes.map((joke,idx) => {
         return (
         <div key={joke.id}>
            <p>{joke.id}</p>
            <h1>title: {joke.title}</h1>
            <p>punchline: {joke.punchline}</p>
            </div>)
        })}   
      
    </div>
  );
};

export default App;
