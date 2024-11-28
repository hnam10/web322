/********************************************************************************
* WEB322 – Assignment 05 *
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html *
* Name: Hansol Nam Student ID: 11302119 Date: Nov.16, 2024 *
* Published URL: https://web322-x3ul.vercel.app/
********************************************************************************/

const express = require('express');
const path = require('path');
const legoData = require('./modules/legoSets'); // legoSets 모듈
const authData = require('./modules/auth-service'); // auth-service 모듈
const clientSessions = require('client-sessions');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// 전역 플래그
let isDbConnected = false;
let legoInitialized = false;
let authInitialized = false;

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 세션 설정
app.use(
  clientSessions({
    cookieName: 'session',
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr',
    duration: 2 * 60 * 1000, // 2분
    activeDuration: 1000 * 60, // 1분
  })
);

// 세션 데이터를 뷰에서 사용할 수 있도록 설정
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Ensure Login 미들웨어
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// MongoDB 초기화 함수
const initializeDatabase = async () => {
  if (isDbConnected) {
    console.log("Reusing existing MongoDB connection");
    return;
  }
  try {
    const dbURI = process.env.MONGO_URI;
    if (!dbURI) throw new Error("MONGO_URI is not defined in environment variables");

    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isDbConnected = true;
    console.log("MongoDB connected successfully");
  } catch (err) {
    throw new Error(`MongoDB connection failed: ${err.message}`);
  }
};

// 서비스 초기화 함수
const initializeServices = async () => {
  try {
    await initializeDatabase(); // MongoDB 초기화

    if (!legoInitialized) {
      await legoData.initialize();
      legoInitialized = true;
      console.log("LEGO data initialized successfully");
    }

    if (!authInitialized) {
      await authData.initialize();
      authInitialized = true;
      console.log("Auth-service initialized successfully");
    }
  } catch (err) {
    throw new Error(`Service initialization failed: ${err.message}`);
  }
};

// 서버 시작
initializeServices()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Unable to start server: ${err.message}`);
  });

// Routes

// Home Route
app.get('/', (req, res) => {
  res.render('home');
});

// About Route
app.get('/about', (req, res) => {
  res.render('about');
});

// Login Routes
app.get('/login', (req, res) => {
  res.render('login', { errorMessage: null, userName: null });
});

app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect('/lego/sets');
    })
    .catch((err) => {
      res.render('login', { errorMessage: err, userName: req.body.userName });
    });
});

// Register Routes
app.get('/register', (req, res) => {
  res.render('register', { successMessage: null, errorMessage: null, userName: null });
});

app.post('/register', (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      res.render('register', { successMessage: 'User created', errorMessage: null, userName: null });
    })
    .catch((err) => {
      res.render('register', { successMessage: null, errorMessage: err, userName: req.body.userName });
    });
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

// User History Route (Protected)
app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory', {
    user: req.session.user,
  });
});

// LEGO Routes
app.get('/lego/sets', async (req, res) => {
  const validThemes = ["technic", "star wars", "city"];
  const theme = req.query.theme?.toLowerCase();

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
    res.status(500).render("500", { message: "Unable to retrieve LEGO sets." });
  }
});

app.get('/lego/sets/:set_num', async (req, res) => {
  try {
    const legoSet = await legoData.getSetByNum(req.params.set_num);
    res.render('set', { set: legoSet });
  } catch (err) {
    console.error(`Error fetching LEGO set: ${err}`);
    res.status(404).render('404', { message: 'LEGO set not found.' });
  }
});

// 기타 라우트는 그대로 유지

// 404 Page Not Found
app.use((req, res) => {
  res.status(404).render('404', { message: 'Page not found.' });
});

module.exports = app;
