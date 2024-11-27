// legoSets.js
require('dotenv').config();
const Sequelize = require('sequelize');

// Sequelize 객체 생성
let sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectModule: require("pg"),
    dialectOptions: {
      ssl: {
        require: true, 
        rejectUnauthorized: false },
    },
  }
);

// Theme 모델 정의
const Theme = sequelize.define('Theme', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  }
}, {
  timestamps: false
});

// Set 모델 정의
const Set = sequelize.define('Set', {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
  },
  year: {
    type: Sequelize.INTEGER,
  },
  num_parts: {
    type: Sequelize.INTEGER,
  },
  theme_id: {
    type: Sequelize.INTEGER,
  },
  img_url: {
    type: Sequelize.STRING,
  }
}, {
  timestamps: false
});

// 테이블 관계 설정
Set.belongsTo(Theme, { foreignKey: 'theme_id' });

// // 기존 데이터 삽입 (bulkCreate)
// const setData = require('../data/setData');
// const themeData = require('../data/themeData');

// sequelize.sync()
//   .then(async () => {
//     try {
//       await Theme.bulkCreate(themeData);
//       await Set.bulkCreate(setData);
//       console.log("-----");
//       console.log("data inserted successfully");
//     } catch (err) {
//       console.log("-----");
//       console.log(err.message);
//     }
//     process.exit();
//   })
//   .catch((err) => {
//     console.log('Unable to connect to the database:', err);
//   });

// 데이터베이스 초기화 함수
function initialize() {
  return new Promise((resolve, reject) => {
    console.log("Starting LEGO data initialization...");

    try {
      // 데이터 초기화 작업 (예: DB 연결 및 데이터 로드)
      console.log("Simulating LEGO data loading...");
      sequelize.sync();

      // resolve(); 를 호출하여 초기화 완료 시 성공
      resolve();

      // 만약 reject()를 호출할 경우, 초기화 실패 처리
      // reject("Initialization failed intentionally for testing");
    } catch (error) {
      console.error("Error in LEGO data initialization:", error);
      reject(error);
    }
  });

}

// 기존 함수 리팩터링 (getAllSets, getSetByNum 등)
async function getAllSets() {
  try {
    const sets = await Set.findAll({ include: [Theme] });
    return sets;
  } catch (error) {
    throw new Error("Unable to retrieve sets");
  }
}

async function getSetByNum(setNum) {
  try {
    const set = await Set.findOne({
      include: [Theme],
      where: { set_num: setNum }
    });
    if (set) {
      return set;
    } else {
      throw new Error("Unable to find requested set");
    }
  } catch (error) {
    throw error;
  }
}
async function getSetsByTheme(theme) {
  try {
    const sets = await Set.findAll({
      include: [{
        model: Theme,
        where: {
          name: {
            [Sequelize.Op.iLike]: `%${theme}%`
          }
        }
      }]
    });
    
    if (sets.length > 0) {
      return sets;
    } else {
      throw new Error("Unable to find requested sets");
    }
  } catch (error) {
    throw error;
  }
}

// 새로운 세트 추가 함수
async function addSet(setData) {
  try {
    const newSet = await Set.create(setData);
    return newSet;
  } catch (error) {
    throw new Error("Unable to add new set: " + error.message);
  }
}

// 세트 수정 함수
async function updateSet(setNum, updatedData) {
  try {
    const set = await Set.findOne({ where: { set_num: setNum } });
    if (set) {
      await set.update(updatedData);
      return set;
    } else {
      throw new Error("Unable to find set to update");
    }
  } catch (error) {
    throw new Error("Unable to update set: " + error.message);
  }
}

// 세트 삭제 함수
async function deleteSet(setNum) {
  try {
    const deleted = await Set.destroy({ where: { set_num: setNum } });
    if (deleted) {
      return "Set deleted successfully";
    } else {
      throw new Error("Unable to find set to delete");
    }
  } catch (error) {
    throw new Error("Unable to delete set: " + error.message);
  }
}

module.exports = {
  initialize,
  getAllSets,
  getSetByNum,
  getSetsByTheme,
  addSet,
  updateSet,
  deleteSet
};
