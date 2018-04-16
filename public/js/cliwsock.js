// The main socket to the server
var socket;

// The room sockets to the server
var sockets = {};

// The active/displayed socket (just a pointer)
var active_room;

$(document).ready(function onLoadCliWSock(){
    socket = io({query: {userid: (chatUser ? chatUser.userid : '')} });

    socket
        .on('connect', function socketConnect() {
            let ready = {
                get_self: true,
                get_rooms: true,
                min_time: false,
                check: function() {
                    for(let val in this) {
                        if(this[val] === false) return;
                    }
                    $("#splashscreen").fadeOut(200);
                }
            };
            setTimeout(function() { ready.min_time = true; ready.check();}, 900);

            socket.emit('get self', function eGetSelf(user) {
                updateSelf(user);
                ready.get_self = true;
                ready.check();
            });


            socket.emit("get rooms", function(rooms) {
                console.log("Rooms:",rooms);
                for(let room in rooms) {
                    genRoomConnection(room, rooms[room]);
                }
                setRooms(rooms);
                ready.get_rooms = true;
                ready.check();
            });





        })
        .on('room made', function eRoomMade(rooms) {
            for(let room in rooms) {
                genRoomConnection(room, rooms[room]);
                addRoom(rooms[room]);
            }
            console.log("New room made", rooms);
        })
        .on('sentNickName', function sentNickName(name, id){
          $("div[userid=" + id + "]" ).text(name);
        })
        .on('disconnect', function eDisconnect() {
            console.log("Disconnected from server");
        });


    $("#input_area")
        .keydown(function inputKeydown(event) {
            if(event.keyCode === 13) {
                if(!event.shiftKey) {
                    if($(this).val() === "") return false;
                    active_room.sendMessage({msg: $(this).val(), type: "msg"});
                    $(this).val("");
                    setInputHeight($(this));
                    return false;
                }
            }
        })
        .bind("input propertychange", function() {
            setInputHeight($(this));
        });
    $('#imggetid').bind('change', function(e){
        var data = e.originalEvent.target.files[0];
        readThenSendFile(data);
    });

    document.getElementById('makeroommod').addEventListener('click', newroom);

});

function genRoomConnection(roomid, roomname) {
    let r = newRoomConnection(roomid);
    sockets[roomname] = r;
    r.postShow = r.postAdd = scrollBottom;
    if(!active_room) { active_room = r; r.show(); }
    $("#chat").append(r.messagebox);
    $("#right_content").append(r.onlinelist);
}

function readThenSendFile(data){

    var reader = new FileReader();
    reader.onload = function(evt){

        var msg ={};
        msg.msg = evt.target.result;
        msg.fileName = data.name;
        msg.type = "picture"
        active_room.sendMessage(msg);
    };
    reader.readAsDataURL(data);
}

function updateSelf(values){
  console.log(values);
  setName(values.nickname, values.userid)
}

function newroom(){
    nchat= document.getElementById('nchat');
    console.log(nchat.value);
    var msg ={};
    msg.roomname=nchat.value
    msg.private= $('#privateform input[name=private]:checked',).val()

    console.log(msg)
    socket.emit("make room", msg);
}

function scrollBottom() {
    try{
        $("#chat").scrollTop($("#chat>div")[0].scrollHeight);
    } catch(e) {
        // Do nothing
    }
}

function setRooms(rooms) {
    $("#rooms").empty();
    for(let room in rooms) {
        addRoom(rooms[room]);
    }
    $("#rooms>li:first-child").css('font-weight', 'bold');
}

function addRoom(room) {
    $("#rooms").append($("<li>")
                .text(room)
                .click(function() {
                    let clicked = this;
                    $("#rooms>li").each(function() {
                        if($(this)[0] == $(clicked)[0]) {
                            $(this).css('font-weight', 'bold');
                        } else {
                            $(this).css('font-weight', 'normal');
                        }
                    });
                    active_room.hide();
                    active_room = sockets[room];
                    active_room.show();
                })
            );

}

function makeroom(room) {
    socket.emit('make room', room, function(response) {
        if(response) {
            console.log("Room made!");
        } else {
            console.log("Room make failed");
        }
    });
}

function setInputHeight(element) {
    element.height((element.val().split("\n").length) * (parseFloat(element.css("line-height").replace("px", ""))));
    scrollBottom();
}

function setName(name, id){
  document.getElementById("nickInput").placeholder = name;
  document.getElementById("nickname").innerHTML = name;
  $("div[userid='" + id + "']" ).text(name);
}

document.getElementById("saveNickInput").addEventListener("click", function() {
  socket.emit("setNickName", document.getElementById("nickInput").value, function(response){

        setName(document.getElementById("nickInput").value, response);


  });

})
