function newRoomConnection(namespace) {
    let ret = {};
   
    let options = {query: {userid: (chatUser ? chatUser.userid : '')} };
    ret.socket = io("/" + namespace, options);

    ret.socket
        .on('connect', function roomSocketConnect() {
            console.log("Connected to room", namespace);
        })
        .on('disconnect', function roomSocketDisconnect() {
            console.log("Disconnected from room", namespace);
        })
        .on('msg send', function roomSocketMsgSend(msg) {
            console.log("msg send", msg);
            ret.addMessage(msg);
        })
        .on('msg edit', function roomSocketMsgEdit(msg) {
            console.log("msg edit", msg);
        })
        .on('user join', function roomSocketUserJoin(user) {
            ret.joinUser(user);
        })
        .on('user leave', function roomSocketUserLeave(user) {
            ret.leaveUser(user);
        })
        .emit('get history', function roomSocketGetHistory(history) {
            for(let msg of history) {
                ret.addMessage(msg);
            }
        })
        .emit('get online', function roomSocketGetOnline(online) {
            console.log(online);
            for(let user of online) {
                ret.joinUser(user);
            }
        });

    ret.sendMessage = function roomSendMsg(msg) {
        ret.socket.emit('msg send', msg, function(response) {
            console.log("sent msg", response);
            ret.addMessage(response);
        }); 
    }

    ret.messagebox = $("<div>");
    ret.onlinelist = $("<div>");

    let onlineUsers = [];
    
    ret.postAdd = null;
    ret.addMessage = function roomAddMessage(msg) {
        if (msg.type==="msg"){
            $(ret.messagebox).append(
                $("<div>")
                    .addClass("flexcontainer flexrow flexwrap flexmsg")
                    .append($("<p>").text(formatMsgTime(msg.timestamp)))
                    .append($("<p>").text(msg.nickname).css('color', msg.nickcolor))
                    .append($("<p>").text(msg.msg))
            );
        }
        if (msg.type==="picture"){
            let picture=$(ret.messagebox).append(
                $("<div>")
                    .addClass("flexcontainer flexrow flexwrap flexmsg")
                    .append($("<p>").text(formatMsgTime(msg.timestamp)))
                    .append($("<p>").text(msg.nickname).css('color', msg.nickcolor))
                    .append($("<img>").attr("src",msg.msg).css("width", "90%"))
            );
            width=picture.find("img").height()
            console.log(width)
        }
        ret.postAdd();
    };

    ret.joinUser = function roomJoinUser(user) {
        if(onlineUsers.includes(user.userid)) { return; }
        onlineUsers.push(user.userid);
        $(ret.onlinelist).append(
            $("<div>")
                .text(user.nickname)
                .css('color', user.nickcolor)
                .attr('userid', user.userid)
            );
    };

    ret.leaveUser = function roomLeaveUser(user) {
        if(!onlineUsers.includes(user.userid) || user.userid === chatUser.userid) { return; }
        onlineUsers.splice(onlineUsers.indexOf(user.userid), 1);
        console.log(onlineUsers);
        $("div[userid=" + user.userid + "]").remove();
    }

    ret.hide = function roomHide() {
        $(ret.messagebox).hide();
        $(ret.onlinelist).hide();
    };

    ret.postShow = null;
    ret.show = function roomShow() {
        $(ret.messagebox).show();
        $(ret.onlinelist).show();
        $("#roomcode").text("localhost/chat/join" + active_room.socket.nsp)
        ret.postShow();
    };

    ret.hide();

    return ret;
}

function formatMsgTime(timestamp) {
    let date = new Date(timestamp);
    return (date.getHours() % 12 === 0 ? "12" : date.getHours() % 12) + ":" +
          (date.getMinutes() < 10 ? '0' : '' ) + date.getMinutes() + " " +
          (date.getHours() > 12 ? "PM" : "AM");
}
