/********************************************************************************
* WEB322 – Assignment 04 *
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html *
* Name: Hansol Nam Student ID: 11302119 Date: Nov.4, 2024 *
* Published URL: https://web322-7i7m.vercel.app/
********************************************************************************/

const express = require('express');
const path = require('path');
const legoData = require('./modules/legoSets');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Initialize LEGO data 
legoData.initialize()
  .then(() => {
    console.log('Lego data initialized');
  })
  .catch((err) => {
    console.error('Failed to initialize Lego data:', err);
  });

app.use(express.static(path.join(__dirname, '/public')));

// Home Route
app.get('/', (req, res) => {
  res.render("home");
});

// About Route
app.get('/about', (req, res) => {
  res.render("about");
});

// Valid themes array
const validThemes = ["technic", "star-wars", "city"];

// Route to display LEGO sets by theme or all sets if no theme is provided
app.get('/lego/sets', (req, res) => {
  const theme = req.query.theme?.toLowerCase();

  // Filter by theme if valid
  legoData.getAllSets()
    .then((sets) => {
      if (theme) {
        if (!validThemes.includes(theme)) {
          return res.status(404).render("404", { message: `No sets found for the theme "${theme}".` });
        }
        // Filter sets by valid theme
        sets = sets.filter(set => set.theme.toLowerCase() === theme);
      } else {
        // Only show valid themes
        sets = sets.filter(set => validThemes.includes(set.theme.toLowerCase()));
      }

      if (sets.length === 0) {
        return res.status(404).render("404", { message: "No LEGO sets available for this theme." });
      }
      
      res.render("sets", { sets: sets, page: "/lego/sets", theme: theme, singleSet: false });
    })
    .catch(() => res.status(404).render("404", { message: "Error retrieving LEGO sets." }));
});

// Route LEGO set
app.get('/lego/sets/:set_num', (req, res) => {
  const setNum = req.params.set_num;

  legoData.getSetByNum(setNum)
    .then((legoSet) => {
      if (!legoSet || !validThemes.includes(legoSet.theme.toLowerCase())) {
        return res.status(404).render("404", { message: `LEGO set with set number "${setNum}" not found.` });
      }
      res.render("set", { set: legoSet, page: "" });
    })
    .catch(() => res.status(404).render("404", { message: "Error fetching LEGO set data." }));
});

// 404 
app.use((req, res) => {
  res.status(404).render("404", { message: "The page you are looking for does not exist." });
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
