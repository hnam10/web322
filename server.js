
/********************************************************************************
* WEB322 – Assignment 02 *
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy: *
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html *
* Name: Hansol Nam Student ID: 11302119  0 Date: Sept.30 2024 *
* Published URL: ___________________________________________________________
* ********************************************************************************/
const legoData = require("./modules/legoSets");
const express = require('express'); // "require" the Express module
const app = express(); // obtain the "app" object
const HTTP_PORT = process.env.PORT || 8080; // assign a port

// start the server on the port and output a confirmation to the console
app.listen(HTTP_PORT, () => {
    legoData.initialize();
    console.log(`server listening on: ${HTTP_PORT}`)
});


app.get('/', (req, res) => {
    res.send('Assignment 2: Hansol Nam - 113021190');
  });

app.get('/lego/sets', (req, res) => {
    legoData.getAllSets().then(sets => res.send(sets))    
});

app.get('/lego/sets/num-demo', (req, res) => {
    legoData.getSetByNum("001-1").then(sets => res.send(sets)).catch(error =>
        res.send("something wrong")
    )
});

app.get('/lego/sets/theme-demo', (req, res) => {
    legoData.getSetsByTheme("tech").then(sets => res.send(sets)).catch(error =>
        res.send("something wrong")
    )  
});