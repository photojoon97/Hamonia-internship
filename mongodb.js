//DB 연결 설정 모듈
const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/hamonia");
const db = mongoose.connection;
db.on('error', function () {
    console.log('DB connection failed');
});
db.once('open', function () {
    console.log('DB connction success');
});

module.exports = db;
//mongodb://localhost:27017/hamonia 이걸로 바꿔주기
//mongodb://joon:d6l9eViXWaTW@127.0.0.1:27017/hamonia
//mongoose.connect("mongodb://joon:d6l9eViXWaTW@127.0.0.1:27017/hamonia");