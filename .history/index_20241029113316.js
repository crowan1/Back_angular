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
  connectionLimit: 10,
});


app.get("/test", (req, res) => {
    connection.query(
      ` SELECT url, i.id AS id_image, id_categorie, nom AS nom_categorie
      FROM image i
      JOIN categorie c ON i.id_categorie = c.id
      WHERE c.id_utilisateur = 1`,
      (err, rows) => {
        if (err) throw err;
  
        //solution 2 :
  
        const categories = rows.reduce((accumulateur, image) => {
          //si on trouve la catégorie on ajoute l'image à cette c&tégorie,
          //sinon on ajoute un nouvel objet au tableau
  
          const categorieExistante = accumulateur.filter(
            (categorie) => categorie.nom == image.nom_categorie
          );
  
          if (categorieExistante.length >= 1) {
            categorieExistante[0].images.push(image.url);
          } else {
            accumulateur.push({
              nom: image.nom_categorie,
              id: image.id_categorie,
              images: [image.url],
            });
          }
  
          return accumulateur;
        }, []);
  
        res.send(JSON.stringify(categories));
      }
    );
  });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});