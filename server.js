var log4js_utils = require('./log4js-utils');
var logger = log4js_utils.logger();
var loggerApp = log4js_utils.loggerApp();
var send_email_utils = require('./send-email-utils');

var express = require('express');
var session = require('express-session');
var server = require('https');
var http = require('http');
var path = require('path');
var url = require('url');
express
var fs = require('fs');
const mongoose = require('mongoose');
const DB = require('./mongodb');
const MongoStore = require('connect-mongo')(session);
const User = require('./models/users');

var bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

var passport = require('passport');
var passportConfig = require('./public/js/passport'); //

var flash = require('connect-flash');
var ejs = require('ejs');
var router = require('./router/index');
var authRouter = require('./router/auth')


function resolveURL(url) {
    var isWin = !!process.platform.match(/^win/);
    if (!isWin) return url;
    return url.replace(/\//g, '\\');
}

try {
    process.argv.forEach(function (val, index, array) {
        if (!val) return;
    });
} catch (e) {
    logger.info(' ==== error : ' + e);
}


//force auto reboot on failures
var autoRebootServerOnFailure = false;
var isErrorSendEmail = false; // 에러 메일 전송

var HTTP_PORT = 80;
var port = 443;

var ssl_key = fs.readFileSync(path.join(__dirname, resolveURL('fake-keys/privatekey.pem')));
var ssl_cert = fs.readFileSync(path.join(__dirname, resolveURL('fake-keys/certificate.pem')));
var ssl_cabundle = null;

var app = express();
var http_app;

var options = {
    key: ssl_key,
    cert: ssl_cert,
    passphrase: '******',
    ca: ssl_cabundle
};

var db = DB;

//mongod
//mongoose.connect("mongodb://localhost:27017/hamonia");
//var db = mongoose.connection;
//db.on('error', function () {
//    console.log('DB connection failed');
//});
//db.once('open', function () {
//    console.log('DB connction success');
//});

//MongoStore는 세션 데이터를 저장하기 위해 사용된다.
//이전에 mongoose.createConnection의 결과를 담아뒀던 connection 상수를 이용
const sessionStore = new MongoStore({
    mongooseConnection: db,
    collection: 'sessions'
});

http_app = express();
http_app.set('port', port);


app = server.createServer(options, http_app);


http_app.use(express.static(path.join(__dirname, 'public')));
http_app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: sessionStore
}));

http_app.use(bodyParser.json({
    limit: '50mb'
}));
http_app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));

http_app.use(cookieParser());

// JSON과 x-www-form-urlencoded로 온 데이터를 Express가 파싱할 수 있도록 다음 미들웨어를 추가해준다.
// `bodyParser`와 비슷한데, 대부분의 앱에서 여기에 bodyParser를 추가하는 것을 보았을 것이다.
http_app.use(express.json());
http_app.use(express.urlencoded({
    extended: true
}));

http_app.set('view engine', 'ejs');
http_app.use(passport.initialize());
http_app.use(passport.session());
passportConfig();
http_app.use(flash());
http_app.use(router);
http_app.use(authRouter);


//login 
//http_app.post('/login', function(req, res){
//    
//})

//translation] naver
var express = require('express');
var client_id = '******';
var client_secret = '*********';
var request = require('request');
//const { MongoStore } = require('connect-mongo');
http_app.post('/translate', function (req, res) {

    var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
    var queryText = req.body.textData;
    var sourceLanguage = req.body.source;
    var targetLanguage = req.body.target;

    var options = {
        url: api_url,
        form: {
            'source': sourceLanguage,
            'target': targetLanguage,
            'text': queryText
        },
        headers: {
            'X-Naver-Client-Id': client_id,
            'X-Naver-Client-Secret': client_secret
        }
    };

    request.post(options, function (error, response, body) {

        if (!error && response.statusCode == 200) {
            var jsonData = JSON.parse(body);

            var resData = {}
            resData.success = 'Y';
            resData.translateData = jsonData.message.result.translatedText;
            res.send(resData);

        } else {
            res.status(response.statusCode).end();
            console.log('error = ' + response.statusCode);
        }
    });
});


http_app.get('/', function (req, res, next) {


    if (/^http$/.test(req.protocol)) {
        var host = req.headers.host.replace(/:[0-9]+$/g, "");

        if ((port != null) && port !== port) {
            return res.redirect("https://" + host + ":" + port + req.url, 301);
        } else {
            return res.redirect("https://" + host + req.url, 301);
        }
    }

    fs.readFile(__dirname + '/views/index.ejs', 'utf8', function (error, data) {
        res.writeHead(200, {
            'content-type': 'text/html'
        });
        res.end(ejs.render(data, {
            roomID: '',
            userName: '',
            psycare: '',
            description: 'Hello .. !'
        }));
    });
});


http_app.get('/*', (req, res, next) => {
    //화상히의 방으로 접속하는 부분
    // 여기서 인증 해야함.

    if (/^http$/.test(req.protocol)) {
        var host = req.headers.host.replace(/:[0-9]+$/g, "");
        var url = encodeURI(req.url, 'UTF-8');

        return res.redirect("https://" + host + ":" + port + url, 301);
    }
    if (req.isAuthenticated) { //인증 미들웨어를 만들어야 함. 
        //isAuthenticated 함수로 인증
        var penalty = req.user.penalty || 0;
        res.cookie('nickName', req.user.nickname); //쿠키 설정 닉네임, 한글은 안됨
        
        if (penalty < 3) {
            //req.user.penalty < 3 일 때 
            //유저의 정보를 room.ejs로 전달해야 함.
            fs.readFile(__dirname + '/views/room.ejs', 'utf8', function (error, data) {
                if (error) return errorHandlerFnt(error, req, res, next);

                res.writeHead(200, {
                    'content-type': 'text/html'
                });
                res.end(ejs.render(data, {
                    //유저의 이메일 전달. 
                    email : req.user.email,
                    roomID: '',
                    userName: '',
                    psycare: '',
                    description: 'Hello .. !'
                    //penalty
                }));
            });
        } else if (penalty >= 3) {
            console.log('패널티 3 초과');
            res.redirect('/');
            next();
        }
    } else {
        //로그인이 필요하다는 메시지 띄우기
        res.redirect('/');
        next();
    }
});

//방장 권한 부여
http_app.post('/role', (req,res) => {
    var receiveEmail = req.body.email;
    //console.log(req.cookies.nickName);

    User.updateOne({email : receiveEmail}, {$set : {master:true}})
    .then(result => {
        console.log(result);
    });
    //쿠키 삭제
    res.clearCookie('role');
        
});
//방장 권한 삭제
http_app.post('/roleDelete', (req,res) => {
    var receiveEmail = req.body.email;
    User.updateOne({email : receiveEmail}, {$set : {master:false}})
    .then(result => {
        console.log(result);
    });
})

http_app.post('/startTimer', (req,res) => {
    var receiveEmail = req.body.email;
    var time = req.body.time;
    User.findOne({email : receiveEmail})
    .then(user => {
        console.log('방장권한으로 타이머 세팅');
        if(user.master == true) require('./Signaling-Server.js')((socket) => {
            socket.emit('start-timer',time);
        })
    })
});


//error handler
http_app.use(function (err, req, res, next) {
    errorHandlerFnt(err, req, res, next);
});


//error handler function
function errorHandlerFnt(err, req, res, next) {
    loggerApp.error('[ERROR] ' + err.stack);

    if (isErrorSendEmail) {
        // 메일 발송
        send_email_utils.sendEmailFnt(err, logger, loggerApp, 'Application', goingMainPage(res));
    } else {
        goingMainPage(res); // 메인페이지로 이동
    }
}


//메인페이지로 이동
function goingMainPage(res) {
    fs.readFile('./views/error_page.html', function (err, html) {
        if (err) throw err;
        res.writeHead(500, {
            'Content-Type': 'text/html; charset=utf-8'
        });
        res.write(html);
        res.end();
    });
}


function cmd_exec(cmd, args, cb_stdout, cb_end) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
    me.exit = 0;
    me.stdout = "";
    child.stdout.on('data', function (data) {
        cb_stdout(me, data)
    });
    child.stdout.on('end', function () {
        cb_end(me)
    });
}

function log_console() {
    logger.info(foo.stdout);

    try {
        var pidToBeKilled = foo.stdout.split('\nnode    ')[1].split(' ')[0];
        logger.info('------------------------------');
        logger.info('Please execute below command:');
        logger.info('\x1b[31m%s\x1b[0m ' + 'kill ' + pidToBeKilled);
        logger.info('Then try to run "server.js" again.');
        logger.info('------------------------------');

    } catch (e) {}
}

function runServer() {
    app.on('error', function (e) {
        if (e.code == 'EADDRINUSE') {
            if (e.address === '0.0.0.0') e.address = 'localhost';

            var socketURL = 'https://' + e.address + ':' + e.port + '/';

            logger.info('------------------------------ socketURL : ' + socketURL);
            logger.info('\x1b[31m%s\x1b[0m ' + 'Unable to listen on port: ' + e.port);
            logger.info('\x1b[31m%s\x1b[0m ' + socketURL + ' is already in use. Please kill below processes using "kill PID".');
            logger.info('------------------------------');

            foo = new cmd_exec('lsof', ['-n', '-i4TCP:9001'],
                function (me, data) {
                    me.stdout += data.toString();
                },
                function (me) {
                    me.exit = 1;
                }
            );

            setTimeout(log_console, 250);
        }
    });

    app = app.listen(port, process.env.IP || '0.0.0.0', function (error) {
        var addr = app.address();

        if (addr.address === '0.0.0.0') {
            addr.address = 'localhost';
        }

        var domainURL = 'https://' + addr.address + ':' + addr.port + '/';

        logger.info('------------------------------ domainURL : ' + domainURL);

        logger.info('socket.io is listening at:');
        logger.info('\x1b[31m%s\x1b[0m ' + '\t' + domainURL);

        logger.info('Your web-browser (HTML file) MUST set this line:');
        logger.info('\x1b[31m%s\x1b[0m ' + 'connection.socketURL = "' + domainURL + '";');

        logger.info('------------------------------');
    });

    require('./Signaling-Server.js')(app, function (socket) {
        try {
            var params = socket.handshake.query;

            if (!params.socketCustomEvent) {
                params.socketCustomEvent = 'custom-message';
            }

            socket.on(params.socketCustomEvent, function (message) {
                try {
                    socket.broadcast.emit(params.socketCustomEvent, message);
                } catch (e) {
                    logger.info(' ==== error : ' + e);
                }
            });
        } catch (e) {
            logger.info(' ==== error : ' + e);
        }
    });


    // http -> https porwording start
    http.createServer(http_app).listen(HTTP_PORT).on('listening', function () {
        return logger.info("HTTP to HTTPS redirect app launched.");
    });
}

if (autoRebootServerOnFailure) {
    // auto restart app on failure
    var cluster = require('cluster');
    if (cluster.isMaster) {
        cluster.fork();

        cluster.on('exit', function (worker, code, signal) {
            cluster.fork();
        });
    }

    if (cluster.isWorker) {
        runServer();
    }
} else {
    runServer();
}

