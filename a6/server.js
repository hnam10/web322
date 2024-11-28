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

const app = express();
const PORT = process.env.PORT || 3000;

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
    duration: 5 * 60 * 1000, // 5분
    activeDuration: 5000 * 60, // 5분
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
    return res.redirect('/login'); // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  }
  next();
}const mongoose = require('mongoose');

let isDbConnected = false;
let legoInitialized = false;
let authInitialized = false;

const initializeDatabase = async () => {
  if (isDbConnected) {
    console.log("Reusing existing MongoDB connection");
    return;
  }

  try {
    const dbURI = process.env.MONGODB; // MongoDB 연결 문자열
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

const initializeServices = async () => {
  try {
    await initializeDatabase(); // MongoDB 연결 초기화

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


// LEGO 데이터 초기화
legoData.initialize()
  .then(() => {
    console.log("LEGO data initialized successfully");
    authData.initialize().then(()=> {
      console.log("Auth-service initialized successfully");
      app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error(`Unable to start server: ${err}`);
    });
  })
  .catch((err) => {
    console.error(`Unable to start server: ${err}`);
  });
//Routes

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
  req.body.userAgent = req.get('User-Agent'); // User-Agent 추가
  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect('/lego/sets'); // 로그인 성공 후 LEGO Sets 페이지로 이동
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
  req.session.reset(); // 세션 초기화
  res.redirect('/'); // 홈 페이지로 리다이렉트
});

// User History Route (Protected)
app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory', {
    user: req.session.user, // 사용자 정보 전달
  });
});

// LEGO Routes

app.get('/lego/sets', async (req, res) => {
  const validThemes = ["technic", "star wars", "city"]; // 허용된 theme 값
const theme = req.query.theme?.toLowerCase(); // 소문자로 변환하여 비교

  try {
    let sets;
    if (theme) {
      if (!validThemes.includes(theme)) {
        // 유효하지 않은 theme 값인 경우 404 페이지 렌더링
        return res.status(404).render("404", { message: `No LEGO sets available for the theme "${theme}".` });
      }
      // theme 필터링된 데이터를 가져옴
      sets = await legoData.getSetsByTheme(theme);
    } else {
      // 전체 데이터를 가져오되, validThemes에 포함된 theme만 필터링
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

// Add New LEGO Set (Protected Route)
app.get('/lego/addSet', ensureLogin, (req, res) => {
  res.render('addSet');
});

app.post('/lego/addSet', ensureLogin, async (req, res) => {
  try {
    const newSet = await legoData.addSet(req.body);
    res.redirect(`/lego/sets/${newSet.set_num}`);
  } catch (err) {
    console.error(`Error adding LEGO set: ${err}`);
    res.status(500).render('500', { message: 'Unable to add new LEGO set.' });
  }
});

// Update LEGO Set (Protected Route)
app.get('/lego/editSet/:setNum', ensureLogin, async (req, res) => {
  try {
    const legoSet = await legoData.getSetByNum(req.params.setNum);
    res.render('editSet', { set: legoSet });
  } catch (err) {
    console.error(`Error fetching LEGO set for editing: ${err}`);
    res.status(404).render('404', { message: 'LEGO set not found.' });
  }
});

app.post('/lego/updateSet/:setNum', ensureLogin, async (req, res) => {
  try {
    await legoData.updateSet(req.params.setNum, req.body);
    res.redirect('/lego/sets');
  } catch (err) {
    console.error(`Error updating LEGO set: ${err}`);
    res.status(500).render('500', { message: 'Unable to update LEGO set.' });
  }
});

// Delete LEGO Set (Protected Route)
app.get('/lego/deleteSet/:setNum', ensureLogin, async (req, res) => {
  try {
    await legoData.deleteSet(req.params.setNum);
    res.redirect('/lego/sets');
  } catch (err) {
    console.error(`Error deleting LEGO set: ${err}`);
    res.status(500).render('500', { message: 'Unable to delete LEGO set.' });
  }
});

// 404 Page Not Found
app.use((req, res) => {
  res.status(404).render('404', { message: 'Page not found.' });
});
module.exports = app;
