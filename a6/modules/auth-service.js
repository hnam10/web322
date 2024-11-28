const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

let User;

// Mongoose Schema 정의
const userSchema = new mongoose.Schema({
    userName: { type: String, unique: true },
    password: String,
    email: String,
    loginHistory: [
        {
            dateTime: Date,
            userAgent: String,
        },
    ],
});

// MongoDB 연결 상태 관리
let isDbConnected = false;

function initialize() {
    return new Promise((resolve, reject) => {
        if (isDbConnected) {
            console.log("Reusing existing MongoDB connection");
            return resolve(); // 이미 연결된 경우 초기화 필요 없음
        }

        try {
            const db = mongoose.createConnection(process.env.MONGODB, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });

            // 에러 처리
            db.on('error', (err) => {
                console.error("MongoDB connection error:", err);
                reject(err); // 연결 실패 시 Promise reject
            });

            // 연결 성공 시 User 모델 초기화
            db.once('open', () => {
                User = db.model('users', userSchema);
                isDbConnected = true; // 연결 상태 업데이트
                console.log("MongoDB connected successfully and User model initialized.");
                resolve(); // 연결 성공 시 Promise resolve
            });
        } catch (error) {
            console.error("MongoDB initialization error:", error);
            reject(error);
        }
    });
}

function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // 비밀번호 확인
        if (userData.password !== userData.password2) {
            return reject('Passwords do not match');
        }

        bcrypt
            .hash(userData.password, 10) // 비밀번호 해시화
            .then((hash) => {
                userData.password = hash;

                const newUser = new User({
                    userName: userData.userName,
                    password: userData.password,
                    email: userData.email,
                    loginHistory: [],
                });

                // 사용자 저장
                newUser
                    .save()
                    .then(() => resolve('User registered successfully'))
                    .catch((err) => {
                        if (err.code === 11000) {
                            reject('User Name already taken'); // 중복된 사용자 이름
                        } else {
                            reject(`There was an error creating the user: ${err}`); // 기타 에러
                        }
                    });
            })
            .catch((err) => reject(`Error hashing password: ${err}`));
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .then((user) => {
                if (!user) {
                    return reject(`Unable to find user: ${userData.userName}`);
                }

                bcrypt
                    .compare(userData.password, user.password) // 비밀번호 비교
                    .then((result) => {
                        if (!result) {
                            return reject(`Incorrect Password for user: ${userData.userName}`);
                        }

                        user.loginHistory.unshift({
                            dateTime: new Date().toString(),
                            userAgent: userData.userAgent,
                        });

                        User.updateOne(
                            { userName: user.userName },
                            { $set: { loginHistory: user.loginHistory } }
                        )
                            .then(() => resolve(user))
                            .catch((err) =>
                                reject(`There was an error updating the login history: ${err}`)
                            );
                    })
                    .catch((err) => reject(`Error comparing passwords: ${err}`));
            })
            .catch(() => reject(`Unable to find user: ${userData.userName}`));
    });
}

// 모듈 내보내기
module.exports = {
    initialize,
    registerUser,
    checkUser,
};
