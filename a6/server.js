/********************************************************************************
* WEB322 – Assignment 05 *
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html *
* Name: Hansol Nam Student ID: 11302119 Date: Nov.16, 2024 *
* Published URL: https://web322-x3ul.vercel.app/
********************************************************************************/
/********************************************************************************
* WEB322 – Assignment 05 *
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html *
* Name: Hansol Nam Student ID: 11302119 Date: Nov.16, 2024 *
* Published URL: https://web322-x3ul.vercel.app/
********************************************************************************/

// .env 파일은 로컬에서만 사용
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// MongoDB 연결 설정
const mongoose = require('mongoose');
const dbURI = process.env.MONGODB;
if (!dbURI) {
  throw new Error("MONGODB is not defined in environment variables");
}

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Express 및 기타 모듈 불러오기
const express = require('express');
const path = require('path');
const legoData = require('./modules/legoSets'); // legoSets 모듈
const authData = require('./modules/auth-service'); // auth-service 모듈
const clientSessions = require('client-sessions');

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
    duration: 60 * 60 * 1000, // 60분
    activeDuration: 5 * 60 * 1000, // 5분
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
  isDbConnected = true;
  console.log("MongoDB connection already initialized");
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
// ... (기존 Routes는 그대로 유지)
app.get('/', (req, res) => {
  res.render('home');
});

// 나머지 라우트도 동일하게 유지
app.use((req, res) => {
  res.status(404).render('404', { message: 'Page not found.' });
});

module.exports = app;
