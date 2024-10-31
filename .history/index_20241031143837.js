const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
const jwt = require("jsonwebtoken");
const secret_jwt = "azerty123456789";

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

function authenticateToken(req, res, next) {

  //on recupere le jwt dans le header authorization
  const jwt_utilisateur = req.headers.authorization;

  //si il n'y a pas d'entete authorization on bloque la requete
  if (!jwt_utilisateur) {
    res.status(403).send();
  } else {

    //on vérifie que le JWT est valide
    jwt.verify(jwt_utilisateur, secret_jwt, (err, donnees_jwt) => {
      //si la signature ne correspond pas ou si le jwt est invalide

      console.log(err);
      if (err) return res.sendStatus(403);

      req.user = donnees_jwt;

      next();
    });
  }
}

app.post("/login", (req, res) => {
  const utilisateur = req.body;

  connection.execute(
    `SELECT id
    FROM utilisateur u
    WHERE u.email = ?
    AND u.password = ?`,
    [utilisateur.email, utilisateur.password],
    (err, rows) => {
      if (err) throw err;

      //si l'utilisateur n'a pas été trouvé
      if (rows.length == 0) {
        res.status(403).send();
      } else {
        const jwt_utilisateur = jwt.sign({ sub: rows[0].id }, secret_jwt);

        res.send(JSON.stringify({ jwt: jwt_utilisateur }));
      }
    }
  );
});

app.get("/admin", authenticateToken, (req, res) => {
    connection.execute(
      `SELECT email FROM utilisateur`,  
      (err, rows) => {
        if (err) {
          console.error("Erreur lors de la récupération des utilisateurs :", err);
          return res.status(500).send("Erreur serveur");
        }
        
        res.status(200).json(rows);
      }
    );
  });


// Get ticket 
app.get('/tickets', (req, res) => {
    connection.query('SELECT t.*, u.email AS assigned_to FROM tickets t LEFT JOIN utilisateur u ON t.assigned_to = u.id', (err, results) => {
        if (err) return res.status(500).json({ error: err });

        const formattedResults = results.map(ticket => {
            return {
                ...ticket,
                created_at: ticket.created_at.toISOString().replace('T', ' ').replace('.000Z', ''),  
                resolved_at: ticket.resolved_at ? ticket.resolved_at.toISOString().replace('T', ' ').replace('.000Z', '') : null,
                assigned_to: ticket.assigned_to || 'Non attribué' 
            };
        });

        res.json(formattedResults);
    });
});


// Post ticket
app.post("/createtickets", authenticateToken, (req, res) => {
    const { description, priority } = req.body;
  
    const query = "INSERT INTO tickets (description, priority) VALUES (?, ?)";
    connection.execute(query, [description, priority], (err, results) => {
      if (err) {
        console.error("errreur d'jaout ticket:", err);
        return res.status(500).json({ error: "12" });
      }
  
      res.status(201).json({ id: results.insertId, description, priority });
    });
  });
  

  

app.listen(port, () => {
  console.log(`Example app listening on port ${port} !!!!!!`);
});