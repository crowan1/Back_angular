const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
const jwt = require('jsonwebtoken');
const secret_jwt = 'azerty12345';

app.use(cors());
app.use(express.json());

const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "tier_list_dfs_24",
  connectionLimit: 10,
});

app.post("/login",(req,res) => {
    const utilisateur = req.body;

    connection.execute(
        ` SELECT id
        FROM  utilisateur u 
        WHERE u.email = ?
        AND u.password = ?`, [utilisateur.email, utilisateur.password],
    (err, rows)=>{
        if (err) throw err;
        //  si l'utilisatuer n'a pas été trouvé
        if (rows.length == 0) {
            res.status(403).send(JSON.stringify({"message" : "cet utilisateur n'éxiste pas"}))
        } else {


            const jwt_utilisateur  = jwt.sign({sub :  rows[0].id}, secret_jwt, {
            })


            res.status(200).send(JSON.stringify({jwt: jwt_utilisateur}));
        }
    })

    
 })

app.get("/categories", (req, res) => {

    // on récupere le jwt dans le header authorization
    const jwt_utilisateur = req.headers.authorization;

    // si il n'y a pas d'entente authorization on bloque la requete
    if (!jwt_utilisateur) {
        res.status(403).send();
    } else {

        // sinon on vérifie que le jwt est valide
            jwt.verify(jwt_utilisateur, secret_jwt, (err, donnes_jwt) => {

                // si l asignature ne correcpond pas ou si le jwt est invalide
        if (err) return res.sendStatus(403);

        const id_utilisateur = donnes_jwt.sub;

        console.log(id_utilisateur);
    })
    }

 
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port} !!!!!!`);
});