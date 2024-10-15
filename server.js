/********************************************************************************
* WEB322 – Assignment 02 *
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy: *
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html *
* Name: Hansol Nam Student ID: 11302119 Date: Sept.30 2024 *
* Published URL: https://web322-eight-steel.vercel.app/
********************************************************************************/

const express = require('express'); 
const path = require('path'); 
const legoData = require('./modules/legoSets'); 
const app = express(); 
const PORT = process.env.PORT || 8080; 

// Initialize Lego data 
legoData.initialize()
  .then(() => {
    console.log('Lego data initialized');
  })
  .catch((err) => {
    console.error('Failed to initialize Lego data:', err);
  });


app.use(express.static(__dirname + '/public'));

//  Home 
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html')); // Serve home.html
});

// About
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html')); // Serve about.html
});

//  Lego Sets by theme
app.get('/lego/sets', (req, res) => {
  const theme = req.query.theme; 

  if (theme) {
    
    legoData.getSetsByTheme(theme)
      .then((sets) => {
        if (sets.length === 0) {
          return res.status(404).send(`No Lego sets found for theme: ${theme}`);
        }
        res.json(sets);
      })
      .catch(() => res.status(404).send('Error fetching Lego sets.'));
  } else {
    
    legoData.getAllSets()
      .then((sets) => res.json(sets))
      .catch(() => res.status(404).send('Error fetching Lego sets.'));
  }
});

//  Lego Set by Set Number
app.get('/lego/sets/:set_num', (req, res) => {
  const setNum = req.params.set_num; 

  legoData.getSetByNum(setNum)
    .then((set) => {
      if (!set) {
        return res.status(404).send(`Lego set with set number ${setNum} not found.`);
      }
      res.json(set);
    })
    .catch(() => res.status(404).send('Error fetching Lego set.'));
});

// 404 
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html')); // Serve 404.html
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
