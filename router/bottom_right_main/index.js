var express = require('express'); // express 모듈 사용하기 위함
var router = express.Router();
var path = require('path');

//서버 타이머


router.get('/', function(req, res) {
    //var id = req.session.passport.user;
    //var user_email = id.email;
    //var nickname = id.nickname;
    //var auth_type;
    
    //if(id && id.user_email) user_email = id.email;
    //if(id && id.nickname) nickname = id.nickname;
    //if(id && id.auth_type) auth_type = id.auth_type;

    if (!req.user) {
        res.render('./member/bottom_right_main.ejs', { isLogin: false , nickname : ''  /*auth_type : ''*/});
    }
    else {
        var user = req.user;
        console.log(user);
        res.render('./member/bottom_right_main.ejs', { isLogin: true , email : user.email , nickname : user.nickname, penalty : user.penalty});
    }
});

module.exports = router;