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
        }
    ]
});

// initialize 함수
function initialize() {
    return new Promise((resolve, reject) => {
        // MongoDB 연결
        const db = mongoose.createConnection(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true });

        // 에러 처리
        db.on('error', (err) => {
            reject(err); // 연결 실패 시 Promise reject
        });

        // 연결 성공 시 User 모델 초기화
        db.once('open', () => {
            User = db.model('users', userSchema);
            resolve(); // 연결 성공 시 Promise resolve
        });
    });
}
function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // 비밀번호 확인
        if (userData.password !== userData.password2) {
            return reject('Passwords do not match');
        }

        // bcrypt.hash(userData.password, 10).then(hash => { // Hash the password using a Salt that was generated using 10 rounds
        //     // TODO: Store the resulting "hash" value in the DB
        
        //     // new user object
        //     const newUser = new User({
        //         userName: userData.userName,
        //         password: hash,
        //         email: userData.email,
        //         loginHistory: []
        //     });
            bcrypt.hash(userData.password, 10)
            .then(hash => {
                console.log("Hash generated successfully:", hash);
                resolve(hash);
            })
            .catch(err => {
                console.error("Error while hashing password:", err);
                reject("There was an error encrypting the password");
            });
        
            //save the user to the db
            newUser.save()
                .then(() => resolve('User registered successfully'))
                .catch((err) => {
                    if (err.code === 11000) {
                        reject('User Name already taken'); // 중복된 사용자 이름
                    } else {
                        reject(`There was an error creating the user: ${err}`); // 기타 에러
                    }
                });
        })
            .catch(err => {
                console.log(err);
                reject(`There was an error encrypting the password`);
                // Show any errors that occurred during the process
            });
    });


}
function checkUser(userData) {
    return new Promise((resolve, reject) => {
        // Find the user in the database by userName
        User.findOne({ userName: userData.userName })
        // .exec()
        .then((user) => {
                if (!user) {
                    return reject(`Unable to find user: ${userData.userName}`);
                }

                // Compare the provided password with the hashed password in the database
                bcrypt
                    .compare(userData.password, user.password) // Compare plaintext and hashed password
                    .then((result) => {
                        if (!result) {
                            // If the passwords do not match, reject the promise
                            return reject(`Incorrect Password for user: ${userData.userName}`);
                        }

                        // If passwords match, update the login history
                        user.loginHistory.unshift({
                            dateTime: new Date().toString(),
                            userAgent: userData.userAgent,
                        });

                        // Save the updated login history to the database
                        User.updateOne(
                            { userName: user.userName },
                            { $set: { loginHistory: user.loginHistory } }
                        )
                            .then(() => resolve(user)) // Resolve with the user object if successful
                            .catch((err) => reject(`There was an error updating the login history: ${err}`));
                    })
                    .catch((err) => reject(`Error comparing passwords: ${err}`)); // Handle bcrypt errors
            })
            .catch(() => reject(`Unable to find user: ${userData.userName}`)); // Handle user not found
    });
}

// 모듈 내보내기
module.exports = {
    initialize,
    registerUser,
    checkUser
};