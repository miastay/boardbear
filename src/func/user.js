var myUser = {'id': 0, 'auth': 0, 'brush': null, 'name': ''};

var getMe = () => {
    return myUser;
}

var kickUser = (userid) => {
    console.log(" kicking " + (userid = userid.substring(2)));
    wsend(JSON.stringify({ 'type': 'op', 'data': { 'type': 'kickuser', 'data': { userid } } }))
}
var renameUser = (ruserid) => {
    var rname = window.prompt("Enter your name");
    ruserid = ruserid.substring(2)
    wsend(JSON.stringify({ 'type': 'op', 'data': { 'type': 'nameuser', 'data': { ruserid, rname } } }))
}

var getKickElem = (id) => {
    var kickElem = document.createElement("div");
    kickElem.className = "useredit kick";
    kickElem.id = "ke" + id;
    kickElem.textContent = "kick"
    kickElem.onclick = function () { kickUser($(this)[0].id) }
    return kickElem
}
var getRenameElem = (id) => {
    var renameElem = document.createElement("div");
    renameElem.className = "button";
    renameElem.id = "rn" + id;
    renameElem.textContent = "rename"
    renameElem.onclick = function () { console.log(renameUser($(this)[0].id) + "renamed") }
    return renameElem
}

var getUserEditBox = (user) => {
    var div = document.createElement("div");
    div.id = "edit" + user.id;
    div.className = "useredit closed";

    //add owner perms
    if (myUser.auth == "owner") {
        //add non-self perms
        if (myUser.id != user.id) {
            //kick elem
            div.appendChild(getKickElem(user.id));
        }
        //name elem
        div.appendChild(getRenameElem(user.id));
    }
    return div;
}

const userHasAuth = () => { return myUser.auth == "owner"; }
var sendBrush = (brush) => { wsend(JSON.stringify({ 'type': 'op', 'data': { 'type': 'userbrush', 'data': { brush } } })) }
var receiveBrush = (brush) => { console.log(brush); myUser.brush = brush; }
var receiveName = (name) => { myUser.name = name; }
var toggleUserEdit = (elem) => { elem.className === "useredit open" ? elem.className = "useredit closed" : elem.className = "useredit open"; }

var setUsers = (usersdata) => {
    $("#users")[0].innerHTML = "";
    users = [];
    for (user of usersdata.userset) {
        if (user.id == id) { myUser = user; }
        var c = "";
        c += (user.auth == "guest" ? " guest" : "");
        c += (user.id == id ? " me" : "");
        c += (user.auth == "owner" ? " owner" : "");
        c.trim();
        users.push(user);

        var div = document.createElement("div");
        div.className = `c${c}`;
        div.id = user.id;
        var name = (user.name != "" ? user.name : user.id);
        div.textContent = (user.id == id ? name + " (me)" : (user.auth == "owner" ? name + " (owner)" : name));

        var userSettings = document.createElement("img");
        userSettings.id = user.id;
        userSettings.className = "usersettings";
        userSettings.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAABcUlEQVRIia2WvU7DMBSFv9KWofAC0Lmq+Bk6MSGViQ4gGCjPhECgvhAKkAJSgLLwGmyNMhTSMuQGnMg/acKRrpTY95xzbceOaxTHKrAmzyHwtQS3EN6BhcT4v8WbwEwxiIB6WbEeEAADpW1bEU+jo/QPhNMrIv4pAnNgBJyRTEne4A44BW4kdyFcq4mvEVo2HmwG+8B3BfEYOLAZAFxVMLjIizU0Bq8G4xB4kec9YF2T82irvAnsAs+aynxgQ8ndRL/wHrAlWplRTMh+52pMc+KqSWjgzIA30aZlSErj1jJqz8FtrVjIKWol+37RIFmcyFDFlGQ68mhjnqKIZI0yH1Ed6AJPGsI4Z9KWonSL3MFxTp0bqgpFwLNUfmwTTjEykIvEtUv8kL+Dq0zMgSObQVBBPI3AZqAe1zFwCQzR79p74ERyYmlzHtepiQ/0lbYdjUFX6e8LxyluQulfZpGdDMkN4kN5n5BMixOFtrqg1LXlB2vw9K/XiPbzAAAAAElFTkSuQmCC"
        userSettings.onclick = function () { console.log($("#edit" + ($(this)[0].id))); toggleUserEdit($("#edit" + ($(this)[0].id))[0]) }
        div.appendChild(userSettings);
        $("#users")[0].appendChild(div);
        $("#users")[0].appendChild(getUserEditBox(users.find(x => x.id == userSettings.id)));
        $("#users")[0].appendChild(document.createElement("br"));
        document.getElementById(user.id).style.setProperty('box-shadow', `10px 0px 0px ${user.brush.color} inset`);
    }
    $("#clear")[0].className = userHasAuth() ? "button enabled" : "button disabled";
}