const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('./../models/users');
const saltRounds = 10;

const router = express.Router();

router.post('/signup', (req, res) => {
    //요청으로 온 email이 DB에 저장되어 있는지 확인
    User.findOne({email:req.body.email})
        .then(user => {
            if(user){ //이미 동일한 이메일을 사용하는 유저가 있는 경우, 시간 남으면 닉네임도 검증
                return res.status(400).json({
                email: req.body.email,
                msg: "해당 이메일을 가진 사용자가 존재"
                });
            }
            else{
                const newUser = new User({
                    email : req.body.email,
                    password : req.body.password,
                    nickname : req.body.nickname
                });
        
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if(err) throw err;
            
                        newUser.password = hash; //해시한 비밀번호 저장
            
                        newUser.save();//DB에 저장
                        //res.send('회원가입 완료');
                        res.redirect('/');
                    });
                });
            }
        });
});

router.post('/login', passport.authenticate('local',{
    successRedirect:'/',
    //failureRedirect: '/',
    failureFlash: true
    }
));

router.get('/logout', (req,res) => {
    console.log('attempt to logout');
    if(req.user){
        req.session.destroy();
        console.log('successful logout');
        //리다이렉트
        console.log(req.session);
        res.redirect('/');
    }
});

router.post('/penalty', (req,res) => {
    console.log('attempt to increase penalty');
    console.log('이메일 전달 : ', req.body.email);
    var receiveEmail = req.body.email;
    User.updateOne({email : receiveEmail}, {$inc : {penalty:1}})
        .then(result => {
            console.log(result);
        });
});

module.exports = router;

//express-session은 req 객체안에 req.session 객체를 만든다.
