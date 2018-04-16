const randName = require('../libs/random_name.js');

function user_manager() {
    let ret = {};
    
    let database = {};

    ret.getUser = function usrMgrGetUser(uID) {
        if(uID in database) {
            return database[uID];
        } else {
            return false;
        }
    };

    ret.genUser = function usrMgrGenUser(id) {
        let user = genUser(id);
        while(user.userid in database) {
            if(id) { return false; }
            user = genUser(id);
        }
        database[user.userid] = user;
        console.log("Added user to database! " + user.nickname );
        return user;
    };

    ret.changeName = function userMgrChangeName(user, newNick) {
	if(newNick.length < 1 || newNick.length > 20) {
	    return false;
	}
        let change = true;
        Object.keys(database).forEach(function(key, index) {
            let u = database[key];
            if(u.userid != user.userid && u.nickname.toLowerCase() == newNick.toLowerCase()) {
                change = false;
            }
        });
        if(change) {
            user.nickname = newNick;
            return true;
        } else {
            return false;
        }
    };


    return ret;


}

function genUser(id) {
    let user = {};
    user.nickname = randName.genName();
    user.userid = (id ? id : genUserID());
    user.nickcolor = genColor();
    user.connections = 0;
    user.rooms = [];
    
    return user;
}

function genUserID() {
    return Math.floor(Math.random() * 4294967296 ); // Generate a "32" bit ID 
}

function genColor() {
    let vals = "0123456789ABCDEF";
    let color = "#";
    for(let i = 0; i < 6; i++) {
        color += vals[Math.floor(Math.random() * 16)];
    }
    return color;
}

module.exports = user_manager();


