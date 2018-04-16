var chatUser;

function toggleRight() {
    $("#right_content").animate({
        left: ($("#right_content").css("left").replace("px", "") === $(window).width().toString() ? $(window).width() - $("#right_content").width() : $(window).width())
    }, 500);
    $("#mobile_online_icon").animate({
        'padding-right': ($("#mobile_online_icon").css("padding-right").replace("px", "") === "0" ? $("#right_content").width() : "0")
    }, 500);
}

function toggleMenu() {
    //$("#rooms").animate({
    //    display: ($("#rooms").css("display") === "none" ? "block" : "none")
    //}, 500);
    $("#rooms_wrapper").toggle();
}

$(document).ready(function onLoadCliScript() {

    let userID = getCookie('userid');
    chatUser = { 
        userid: userID,
        };

    $("#mobile_online_icon").click(function() {
        toggleRight();
    });

    $("#mobile_menu_icon").click(function() {
        toggleMenu();
    });
});


function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
}
