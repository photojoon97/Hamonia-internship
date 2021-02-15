var passport = require('passport');
var bcrypt = require('bcryptjs');
var LocalStrategy = require('passport-local').Strategy;
var Users = require('../../models/users');

module.exports = () => {
    //매개변수로 user를 받아 done 함수에 두전째 인자로 전달한다. 
    passport.serializeUser((user, done) => { //로그인 성공 시 실행되는 done(null,user)에서 user객체를 전달받아,
        //사용자 정보를 세션(req.session.passport.user)에 저장
        done(null, user);
        //done(서버에러, 성공 시 return 할 값, 임의의 에러)
    });

    //세션에 저장한 아이디를 통해서 사용자 정보 객체를 불러옴
    //passport.session() 미들웨어가 이 메서드를 호출
    //serializeUser에 저장했던 user를 받아서 데이터베이스에서 사용자 정보를 조회
    //조회한 정보를 req.user에 저장한다.
    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        session: true,
        passReqToCallback:false
        
        }, (email, password, done) => {
            Users.findOne({email: email})
                .then( user => {
                    if(user){
                        //사용자가 있는 경우
                        //console.log(user);
                        //Users.comparePassword(password, (passError, isMatch) => {
                        //    if(isMatch) return done(null, user);
                        //})
                        //return done(null, false, {message : '비밀번호 오류'});
                        bcrypt.compare(password, user.password, (error, result) =>{
                            if(error) throw error;
                            if(result){ //비밀번호가 맞으면
                                return done(null, user);
                                //console.log('login success');
                            }
                            else{// 비밀번호가 일치하지 않으면
                                return done(null, false, {message:"비밀번호 오류"});
                                //console.log('login failed');
                            }
                        });
                    }
                    else{
                        //사용자가 존재하지 않는 경우
                        return done(null, false, {message:"가입되지 않은 사용자"});
                    }
                })
    }));
}