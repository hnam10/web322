/********************************************************************************
* WEB322 – Assignment 05 *
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html *
* Name: Hansol Nam Student ID: 11302119 Date: Nov.16, 2024 *
* Published URL: https://web322-cbbv-ek8o5zwtm-hnam10s-projects.vercel.app/
********************************************************************************/
const express = require('express');
const path = require('path');
const legoData = require('./modules/legoSets'); // legoSets 모듈 가져오기
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));

// Initialize LEGO data
legoData.initialize()
  .then(() => {
    console.log('Lego data initialized');
  })
  .catch((err) => {
    console.error('Failed to initialize Lego data:', err);
  });

// Home Route
app.get('/', (req, res) => {
  res.render("home");
});

// About Route
app.get('/about', (req, res) => {
  res.render("about");
});

// LEGO Sets Route to display by theme or all sets if no theme is provided
app.get('/lego/sets', async (req, res) => {
  const theme = req.query.theme?.toLowerCase();
  const validThemes = ["technic", "star-wars", "city"];

  try {
    let sets;
    if (theme) {
      if (!validThemes.includes(theme)) {
        return res.status(404).render("404", { message: `No LEGO sets available for the theme "${theme}".` });
      }
      sets = await legoData.getSetsByTheme(theme);
    } else {
      sets = await legoData.getAllSets();
      sets = sets.filter(set => set.Theme && validThemes.includes(set.Theme.name.toLowerCase()));
    }

    if (sets.length === 0) {
      return res.status(404).render("404", { message: "No LEGO sets available for this theme." });
    }

    res.render("sets", { sets: sets, page: "/lego/sets", theme: theme, singleSet: false });
  } catch (error) {
    res.status(404).render("404", { message: "Unable to find requested set." });
  }
});

// Route for viewing a specific LEGO set
app.get('/lego/sets/:set_num', async (req, res) => {
  const setNum = req.params.set_num;

  try {
    const legoSet = await legoData.getSetByNum(setNum);
    res.render("set", { set: legoSet, page: "" });
  } catch (error) {
    res.status(404).render("404", { message: `Unable to find requested sets.` });
  }
});

// Route to add a new LEGO set (Form Page)
app.get('/lego/addSet', (req, res) => {
  res.render("addSet");
});

// Add a new LEGO set (Handling POST request)
app.post('/lego/addSet', async (req, res) => {
  try {
    const newSet = await legoData.addSet(req.body);
    res.redirect(`/lego/sets/${newSet.set_num}`);
  } catch (error) {
    res.status(500).render("500", { message: "Unable to add new set." });
  }
});

// Update an existing LEGO set (Form Page)
app.get('/lego/editSet/:setNum', async (req, res) => {
  const setNum = req.params.setNum;
  try {
    const legoSet = await legoData.getSetByNum(setNum);
    res.render("editSet", { set: legoSet });
  } catch (error) {
    res.status(404).render("404", { message: `LEGO set with set number "${setNum}" not found.` });
  }
});

// Update an existing LEGO set (Handling POST request)
app.post('/lego/updateSet/:setNum', async (req, res) => {
  try {
    const updatedSet = await legoData.updateSet(req.params.setNum, req.body);
    res.redirect(`/lego/sets/${updatedSet.set_num}`);
  } catch (error) {
    res.status(500).render("500", { message: "Unable to update set." });
  }
});

// Delete a LEGO set (GET 요청으로 변경)
app.get('/lego/deleteSet/:setNum', async (req, res) => {
  try {
    await legoData.deleteSet(req.params.setNum);
    res.redirect('/lego/sets');
  } catch (error) {
    res.render('500', { message: `I'm sorry, but we have encountered the following error: ${error}` });
  }
});

// 404 Page Not Found
app.use((req, res) => {
  res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for" });
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

