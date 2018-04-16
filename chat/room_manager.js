function room_manager(id) {
    let ret = {};

    let messages = [];

    let users = {};

    ret.id = id;

    ret.addMsg = function roomMgrAddMsg(msg) {
        messages.push(msg);
        if(messages.length > 200) {
            messages.shift();
        }
    };

    ret.getMessages = function roomMgrGetMsg() {
        return messages;
    };

    ret.join = function roomMgrJoin(user) {
        if(users[user.userid]) return false;
        users[user.userid] = user;
        return true;
    };

    ret.leave = function roomMgrLeave(user) {
        delete users[user.userid];
    };

    ret.online = function roomMgrOnline() {
        let ret = [];
        let pos = 0;
        for(let user of Object.values(users)) {
            ret[pos++] = getOutboundUser(user);
        }
        return ret;
    };

    return ret;

}

function getOutboundUser(userVals) {
    return {nickname:userVals.nickname, userid:userVals.userid, nickcolor:userVals.nickcolor};
}

function generateRoomId() {
    let max = 18446744073709551616; // 64 bit
    return Math.floor(Math.random() * max);
}


module.exports = (function() {
    let initialKeys = [];
    let ret = {};

    ret.newMgr = room_manager;
    
    ret.rooms = function roomMgrRooms() {
            return Object.keys(this).filter(function(val) {
                return !(initialKeys.includes(val));
            });
    };

    ret.exists = function roomMgrExists(room) {
            for(let key of ret.rooms()) {
                if(room.toLowerCase() === key.toLowerCase())
                    return key;
            }
            return false;
    };

    ret.getid = function roomMgrGetid(id) {
            for(let key of ret.rooms()) {
                if(id === key.id)
                    return key;
            }
            return false;
    };

    ret.makeRoom = function roomMgrMakeRoom(room) {
            if(ret.exists(room)) return false;
            let id = generateRoomId();
	    while(ret.getid(id)) { id = generateRoomId(); } 
            ret[room] = ret.newMgr(id);
            return room;
    };

    initialKeys = Object.keys(ret);
    
    ret.makeRoom("Lobby 2");
    ret.makeRoom("Lobby 3");
    ret.makeRoom("Lobby 4");
    ret.makeRoom("Lobby 5");

    return ret;
})();
