const express = require('express')
const cors =require ("cors");
const app = express()
const port = 3000

app.use(cors())

const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "tier_list_dfs_24",
});

connection.connect();




app.get('/test', (req, res) => {
    const tableau = ["tata", "toto", "titi"]

  res.send(JSON.stringify(tableau))
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});