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



app.get('/test', (req, res) => {
    connection.connect();

    console.log('A')

    connection.query(
        ` SELECT url, i.id AS id_image, id_categorie, nom
          FROM image i
          JOIN categorie c ON i.id_categorie = c.id
          WHERE c.id_utilisateur = 1`,
        (err, rows) => {
          if (err) throw err;
          console.log(rows);
          console.log('B')
        }
      );
    
      console.log('c')
    connection.end();
    console.log('A')

  res.send(JSON.stringify(tableau))
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});