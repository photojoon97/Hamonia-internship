const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Db } = require('mongodb');
const saltRounds = 10;


var Schema = mongoose.Schema;

var userSchema = new Schema({
    email : {
        type: String,
        required: true
    },
    password : {
        type: String,
        require: true, 
    },
    nickname : {
        type: String,
        required: true
    },
    penalty : {
        type : Number,
        required : true,
        default : 0
    },
    master : {
        type : Boolean,
        default : false
    }
});

//비밀번호 검증 함수
//userSchema.method.comparePassword = function(plainPassword, cb){
//    bcrypt.compare(plainPassword, this.password, function(error, isMatch){
//        if(error){
//            //에러
//            return cb(error);
//        }
//        cb(null, isMatch); //cb와 isMatch는 무엇?
//    })
//}

module.exports = mongoose.model('User', userSchema);