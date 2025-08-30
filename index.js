require('dotenv').config();

const express = require('express')
const app = express()
const port = process.env.PORT

const github = {
  "login": "rafin0906",
  "id": 170607984,
  "node_id": "U_kgDOCitFcA",
  "avatar_url": "https://avatars.githubusercontent.com/u/170607984?v=4",
  "gravatar_id": "",
  "url": "https://api.github.com/users/rafin0906",
  "html_url": "https://github.com/rafin0906",
  "followers_url": "https://api.github.com/users/rafin0906/followers",
  "following_url": "https://api.github.com/users/rafin0906/following{/other_user}",
  "gists_url": "https://api.github.com/users/rafin0906/gists{/gist_id}",
  "starred_url": "https://api.github.com/users/rafin0906/starred{/owner}{/repo}",
  "subscriptions_url": "https://api.github.com/users/rafin0906/subscriptions",
  "organizations_url": "https://api.github.com/users/rafin0906/orgs",
  "repos_url": "https://api.github.com/users/rafin0906/repos",
  "events_url": "https://api.github.com/users/rafin0906/events{/privacy}",
  "received_events_url": "https://api.github.com/users/rafin0906/received_events",
  "type": "User",
  "user_view_type": "public",
  "site_admin": false,
  "name": null,
  "company": null,
  "blog": "",
  "location": null,
  "email": null,
  "hireable": null,
  "bio": null,
  "twitter_username": null,
  "public_repos": 1,
  "public_gists": 0,
  "followers": 0,
  "following": 0,
  "created_at": "2024-05-23T07:26:58Z",
  "updated_at": "2025-07-13T06:45:48Z"
}
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get("/twitter", (req,res) => {
  res.send("rafrafin")
}
)

app.get("/login", (req,res) => {
  res.send("<h1>please login</h1>")
}
)

app.get("/youtube", (req,res) => {
  res.send("Hello youtube")
}
)

app.get("/github",(req,res) => {
  res.json(github);
}
)

app.listen(port, () => {
  console.log(`🟢🟢 Example app listening on port ${port}`)
})
