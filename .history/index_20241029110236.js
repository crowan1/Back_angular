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



app.get('/test', (req, res) => {
 connection.query(
        ` SELECT url, i.id AS id_image, id_categorie, nom AS nom_categorie
          FROM image i
          JOIN categorie c ON i.id_categorie = c.id
          WHERE c.id_utilisateur = 1`,
        (err, rows) => {
          if (err) throw err;
        //   On réalise une structure diférentes du résultat : 
        // Un tableau avec des obejts possédant le nom de la catégorie et les images liées
          const categories = {}

        //   on partcours toutes les lignes du résulat de la reqeuete 
          for (let image of  rows) {

            // Si la catégorie de l'image n'a pas encore été ajoutée, on l'jaoute,
            //  
            if(categories[image.nom_categorie]){


            } else {

                categories[image.nom_categorie] = {
              id : image.id_categorie,
              nom : image.nom_categorie,
              image : []
            }; 
            }
          }
          res.send(JSON.stringify(categories))
        }
      );
    
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});