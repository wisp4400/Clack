module.exports = function(io) {

    const userManager = require('./user_manager');
    const roomManager = require('./room_manager');
    const express = require('express');
    const app = express();
    const passport = require('passport');
    const auth = require('../auth/auth');

    auth(passport);
    app.use(passport.initialize());

    userManager.genUser(1);

    app.get('/', function(req, res) {
        //if(req.cookies.userid && !userManager.getUser(req.cookies.userid)) {
        //    res.clearCookie("userid");
        //}
       // console.log(req);
            let user = userManager.getUser(req.cookies.userid);
            if (!user) {
                res.redirect("/chat/login");

            }

        res.sendFile(__dirname + "/index.html");
    });

    app.get('/g', passport.authenticate('google', {
            failureRedirect: '/login'
        }),
        function(req, res) {
            console.log(req);
            let user = userManager.getUser(req.user.profile.id);
            if (!user) {
                user = userManager.genUser(req.user.profile.id);
            }
            console.log("userid" + user.userid);
            res.cookie('userid', user.userid);
            res.redirect(req.baseUrl);
    });

    app.get('/login', passport.authenticate('google', {
        scope: ['https://www.googleapis.com/auth/userinfo.profile']
    }));

    let defaultRoom = "Lobby";
    roomManager.makeRoom(defaultRoom);

    let spaces = {};
    let rooms = {};
    let publicRooms = {};

    app.get('/join/*', function(req, res) {
        let userid = req.cookies.userid;
        let roomid = req.params[0];
        console.log("User " + userid + " is trying to join " + roomid);
        try {
            let user = userManager.getUser(userid);
            if(rooms[roomid]) {
                user.rooms.push(roomid);
                res.send('Joined');
            } else {
                res.send('invalid room');
            }
        } catch(e) {
            res.status(500);
            res.send('500');
            console.log(e);
        }
    });

    for(let room of roomManager.rooms()) {
        console.log("Generating namespace for room ", roomManager[room].id);
        spaces[room] = makeNamespace(io, roomManager[room], userManager);
        rooms[roomManager[room].id] = room;
        publicRooms[roomManager[room].id] = room;
    }

    io.on('connection', function(socket) {
        let userid = (socket.handshake['query'] ? socket.handshake['query']['userid'] : undefined);
        let userVals = userManager.getUser(userid);
        if(!userVals) {
            console.log("Cannot find user: " + userid);
            socket.disconnect(true);
            return;
        }

        socket.on('get self', function(ackFunction){
          ackFunction(getOutboundUser(userVals));
        });

        socket.on('setNickName', function(value, ackFunction){
          ackFunction(userVals.userid);
          userVals.nickname = value;
          io.emit('sentNickName', getOutboundUser(userVals).nickname);
        });

        socket.on('get rooms', function(ackFunction) {
            let ret = {};
            ret = Object.assign({}, publicRooms);
            for(let room of userVals.rooms) {
                console.log("Adding private room " + room);
                ret[room] = rooms[room];
            }
            ackFunction && ackFunction(ret);
        });

        socket.on('make room', function(msg) {
            let roomname = msg.roomname;
            let private = (msg.private === 'private' ? true : false);
            if(spaces[roomname]) {
                return;
            } else {
                roomManager.makeRoom(roomname);
                spaces[roomname] = makeNamespace(io, roomManager[roomname], userManager);
                rooms[roomManager[roomname].id] = roomname;

                let data = {};
                data[roomManager[roomname].id]=roomname;
                if(!private) {
                    publicRooms[roomManager[roomname].id] = roomname;
                    io.emit('room made', data);
                } else {
                    userVals.rooms.push(roomManager[roomname].id);
                    socket.emit('room made', data);
                }
            }
        });
    });


    return app;
}

function getOutboundUser(userVals) {
    return {nickname:userVals.nickname, userid:userVals.userid, nickcolor:userVals.nickcolor};
}

function generateMsgId(userID) {
    return (Date.now() << 32) | parseInt(userID);
}

function makeNamespace(io, room, userManager) {

    let namespace = io.of('/' + room.id);
    namespace.on('connection', function(socket) {
        let userid = (socket.handshake['query'] ? socket.handshake['query']['userid'] : undefined);
        let userVals = userManager.getUser(userid);
        if(!userVals) {
            // Cannot find user - shut down socket connection
            socket.disconnect(false);
            return;
        }

        console.log("Connection from user " + userVals.nickname + " (" + userVals.userid + ")");
        socket.broadcast.emit('user join', getOutboundUser(userVals));
        room.join(userVals);
        socket.on('msg send', function(msg, ackFunction) {
            try {
                if(!msg.msg) { return; }
                if(msg.msg.startsWith("/")) {
                    if(parseCommand(msg.msg, userVals, socket)) {
                        ackFunction();
                        return;
                    }
                }
                msg.timestamp = Date.now();
                msg.nickcolor = userVals.nickcolor;
                msg.nickname = userVals.nickname;
                msg.userid = userVals.userid;
                msg.msgid = generateMsgId(msg.userid);
                room.addMsg(msg);
                socket.broadcast.emit('msg send', msg);
                ackFunction(msg);
                /*setTimeout(function() {
                    let nmsg = { msgid:msg.msgid, msg:"Edited message!" };
                    io.emit('msg edit', nmsg);
                }, 3000);/**/
            } catch(e) {
                // Do nothing
            }
        });

        socket.on('get history', function(ackFunction) {
            ackFunction && ackFunction(room.getMessages());
        });

        socket.on('get online', function(ackFunction) {
           ackFunction && ackFunction(room.online());
        });

        socket.on('disconnect', function() {
            console.log(userVals.nickname + " has closed a socket.");
            room.leave(userVals);
            namespace.emit('user leave', getOutboundUser(userVals));
        });
    });

    return namespace;
}
