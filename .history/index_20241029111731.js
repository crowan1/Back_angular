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
  
        //on réalise une structure différente du résultat :
        // un tableau avec des objet possédant le nom de la catégore etles images liées
        const groupeParCategorie = {};
  
        //on parcours toutes les lignes du résultat de la requete (qui contienneny chaque images)
        for (let image of rows) {
          //si la catégorie de l'image n'a pas encore été ajoutée, on l'ajoute,
          // sinon on ajoute seulement l'image dans sa liste d'images
          if (groupeParCategorie[image.nom_categorie]) {
            groupeParCategorie[image.nom_categorie].images.push(image.url);
          } else {
            groupeParCategorie[image.nom_categorie] = {
              id: image.id_categorie,
              nom: image.nom_categorie,
              images: [image.url],
            };
          }
        }
  
        //on transforme en tableau l'objet qui nous a servis
        // à regrouper les images par catégorie
        const categories = [];
  
        //on parcours tous les noms des propriétés de l'objet qui regroupe les image par catégiorie
        for (let nomCategorie in groupeParCategorie) {
          categories.push(groupeParCategorie[nomCategorie]);
        }
  
        res.send(JSON.stringify(categories));

        // SOlution 2 : 
        rows.reduce((categories, image) => {
            
            categories.push({nom: image.nom_categorie, id: image.id_categorie});
        })



      }
    );
  });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});