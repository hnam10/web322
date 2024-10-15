const setData = require("../data/setData");
const themeData = require("../data/themeData");
let sets = [];

function initialize() {
    return new Promise((resolve, reject) => {
        try {
            setData.forEach(set => {
                let theme = themeData.find(theme => theme.id === set.theme_id);
                const newSet = {
                    ...set,
                    theme: theme ? theme.name : "Unknown"
                };
                sets.push(newSet);
            });
            resolve();
        } catch (error) {
            reject("Failed")
        }
 
    });
}

function getAllSets() {
    return new Promise((resolve, reject) => {
        console.log(sets[0])
        if (sets.length > 0) {
            resolve(sets); 
        } else {
            reject("No sets available. Initialize the data first.");
        }
    });
}
function getSetByNum(setNum) {
    return new Promise((resolve, reject) => {
        const set = sets.find(set => set.set_num === setNum);
        if (set) {
            resolve(set); // Resolve with the found set object
        } else {
            reject(`Unable to find set with set_num: ${setNum}`); // Reject if not found
        }
    });
}
function getSetsByTheme(theme) {
    return new Promise((resolve, reject) => {
        const searchTheme = theme.toLowerCase();
        const set = sets.filter(set => set.theme.toLowerCase().includes(searchTheme));
        if (set) {
            resolve(set); // Resolve with the found set object
        } else {
            reject(`Unable to find set with theme: ${setNum}`); // Reject if not found
        }
    })
}

module.exports = {
    initialize,
    getAllSets,
    getSetByNum,
    getSetsByTheme
};