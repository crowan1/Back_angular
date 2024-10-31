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
 
            const createdAt = new Date(ticket.created_at);
            const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at) : null;
 
            createdAt.setHours(createdAt.getHours() + 1);  

            return {
                ...ticket,
                created_at: createdAt.toISOString().replace('T', ' ').replace('.000Z', ''),
                resolved_at: resolvedAt ? resolvedAt.toISOString().replace('T', ' ').replace('.000Z', '') : null,
                assigned_to: ticket.assigned_to || 'Non attribué'
            };
        });

        res.json(formattedResults);
    });
});



// Post ticket
app.post("/createtickets", authenticateToken, (req, res) => {
    const { description, priority, assignedTo } = req.body;
 
    const query = "INSERT INTO tickets (description, priority, created_at, assigned_to) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), ?)";
    connection.execute(query, [description, priority, assignedTo], (err, results) => {
        if (err) {
            console.error("Erreur d'ajout ticket:", err);
            return res.status(500).json({ error: "12" });
        }

        res.status(201).json({ id: results.insertId, description, priority, assignedTo });
    });
});

app.get("/users", authenticateToken, (req, res) => {
    connection.execute(`SELECT id, email AS name FROM utilisateur`, (err, rows) => {
        if (err) {
            console.error("Erreur recup utilisateur :", err);
            return res.status(500).send("Erreur serveur");
        }
        res.status(200).json(rows);
    });
});


app.put('/tickets/:id', (req, res) => {
    const ticketId = req.params.id;
    const updatedTicket = req.body;

    // Mise à jour des données dans la base de données 
    connection.query('UPDATE tickets SET ? WHERE id = ?', [updatedTicket, ticketId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Ticket updated successfully' });
    });
});

  

app.listen(port, () => {
  console.log(`Example app listening on port ${port} !!!!!!`);
});