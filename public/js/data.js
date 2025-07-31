// data.js
const myDataArray = [];

function addData(data) {
    myDataArray.push(data);
}

function getData() {
    return myDataArray;
}

module.exports = {
    addData,
    getData,
    myDataArray
};