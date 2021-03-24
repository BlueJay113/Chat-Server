var username = prompt("Preferred Name:");
if (username == null)
{
  alert("Username must not be empty.");
  location.reload();
}else if (username == "")
{
  alert("Username must not be empty.");
  location.reload();
}

var unread = 0;
var messagecount = 0;
var dropdown = document.getElementById("usersDropdown");
var emoji_regex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])+$/;
const hasOnlyEmoji = str => emoji_regex.test(str);

const CLIENT_ID = 'mWce2OJGr3nCwHSm';

const drone = new ScaleDrone(CLIENT_ID, {
  data: {
    name: username,
    color: "#065fd4",
  },
});

let members = [];
const room = drone.subscribe('observable-room');
drone.on('open', error => {
  if (error) {
    return console.error(error);
    document.getElementById("connection-status").innerText = "Error";
    document.getElementById("connection-status").className = "error";
  }
  console.log('Connecting to Chat Server...');
  document.getElementById("connection-status").innerText = "Connecting...";
  document.getElementById("connection-status").className = "connecting";
  room.on('open', error => {
    if (error) {
      return console.error(error);
    }
    console.log('Connected.');
    document.getElementById("connection-status").innerText = "Connected";
    document.getElementById("connection-status").className = "connected";
    document.getElementById("message-form__input").focus();
  });
	room.on('data', (text, member) => {
		const el = "messages";
		if (member) {
			var d = new Date();
			var hour = d.getHours();
			var minute = (d.getMinutes()<10?'0':'') + d.getMinutes();
			if (hour > 12)
			{
				hour = hour - 12;
				var ampm = "PM";
			}
			else {
				var ampm = "AM";
			}
            var clock = hour + ":" + minute + " " + ampm;
			if (member.clientData.name == username){
				responsiveChatPush('.chat', username, 'me', clock, text);
			}
			else {
				responsiveChatPush('.chat', member.clientData.name, 'you', clock, text);
			}
		} else {
		  // Message is from server
		}
	  });
});

room.on('members', m => {
 members = m;
 updateMembersDOM();
});

  room.on('member_join', member => {
    members.push(member);
    updateMembersDOM();
  });

  room.on('member_leave', ({id}) => {
    const index = members.findIndex(member => member.id === id);
    members.splice(index, 1);
    updateMembersDOM();
  });

drone.on('error', () => {
  console.error("Connection error.");
  document.getElementById("connection-status").innerText = "Error"
  document.getElementById("connection-status").className = "error";
});
drone.on('close', () => {
  console.log("Connection closed.");
  document.getElementById("connection-status").innerText = "Connection terminated"
  document.getElementById("connection-status").className = "error";
});

drone.on('disconnect', () => {
  console.log("Disconnected from server, reconnecting...");
  document.getElementById("connection-status").innerText = "Reconnecting..."
  document.getElementById("connection-status").className = "connecting";
});

function createMemberElement(member) {
  const { name, color } = member.clientData;
  const el = document.createElement('p');
  el.appendChild(document.createTextNode(name));
  el.className = 'member';
  el.style.color = color;
  return el;
}

function updateMembersDOM() {
	if (members.length == 1)
	{
		document.getElementsByClassName("members-count")[0].innerText = `${members.length} Person >`;
		document.getElementById("usersIcon").src = "resources/other/1person.png";
	}
	else if (members.length == 2)
	{
		document.getElementsByClassName("members-count")[0].innerText = `${members.length} People >`;
		document.getElementById("usersIcon").src = "resources/other/2people.png";
	}
	else if (members.length <= 3 || members.length == 3)
	{
		document.getElementsByClassName("members-count")[0].innerText = `${members.length} People >`;
		document.getElementById("usersIcon").src = "resources/other/3people.png";
	}
  document.getElementsByClassName("members-list")[0].innerHTML = '';
  members.forEach(member =>
    document.getElementsByClassName("members-list")[0].appendChild(createMemberElement(member))
  );
}

function responsiveChat(element) {
    $(element).html('<form class="chat"><span></span><div class="messages"></div><input oncontextmenu="return false;" id="message-form__input" type="text" placeholder="iMessage"><input oncontextmenu="return false;" id="message-form__button" type="submit" value="Send"></form>');

    $(element + ' input[type="text"]').keypress(function (event) {
        if (event.which == 13) {
            event.preventDefault();
            $(element + ' input[type="submit"]').click();
        }
    });
    $(element + ' input[type="submit"]').click(function (event) {
        event.preventDefault();
        var message = $(element + ' input[type="text"]').val();
        $(element + ' input[type="text"]').val("");
		drone.publish({
			room: 'observable-room',
			message: message,
		});
	$('.messages').scrollTop($(".message:last").prop("scrollHeight") * 10);
    });
}

function responsiveChatPush(element, sender, origin, date, message) {
	messagecount = document.getElementsByClassName("message").length;
	var originClass;
	if (origin == 'me') {
		originClass = 'myMessage';
	} else {
        	originClass = 'fromThem';
	}
	if($(".message:last").children().hasClass("myMessage") == true)
	{
		if (hasOnlyEmoji(message) == true)
		{
			$(element + ' .messages').append('<div class="message" id="' + messagecount + '"><div style="float: right;"><p style="font-size: 20pt">' + message + '</p></div></div>');
		}
		else
		{
			$(element + ' .messages').append('<div class="message" id="' + messagecount + '"><div class="' + originClass + '"><p>' + message + '</p></div></div>');
		}
	}
	else if ($(".message:last").children().hasClass("fromThem") == true)
	{
		if (hasOnlyEmoji(message) == true)
		{
			$(element + ' .messages').append('<div class="message" id="' + messagecount + '"><div style="float: left;"><p style="font-size: 20pt">' + message + '</p></div></div>');
		}
		else
		{
			$(element + ' .messages').append('<div class="message" id="' + messagecount + '"><div class="' + originClass + '"><p>' + message + '</p></div></div>');
		}
	}
	else
	{
		if (hasOnlyEmoji(message) == true)
		{
			if (originClass == "myMessage")
			{
				$(element + ' .messages').append('<div class="message" id="' + messagecount + '"><div style="float: right;"><p style="font-size: 20pt">' + message + '</p><date class="noselect"><b>' + sender + '</b> ' + date + '</date></div></div>');
			}
			else if (originClass == "fromThem")
			{
				$(element + ' .messages').append('<div class="message" id="' + messagecount + '"><div style="float: left;"><p style="font-size: 20pt">' + message + '</p><date class="noselect"><b>' + sender + '</b> ' + date + '</date></div></div>');
			}
		}
		else
		{
			$(element + ' .messages').append('<div class="message" id="' + messagecount + '"><div class="' + originClass + '"><p>' + message + '</p><date class="noselect"><b>' + sender + '</b> ' + date + '</date></div></div>');
		}
	}
	
	if (!document.hasFocus())
	{
		unread++;
		if (unread > 0)
		{
			document.getElementsByTagName("title")[0].innerText = "(" + unread + ") Chat Client";
			document.getElementById("favicon").href = "resources/other/icon-unread.ico";
		}
		var options = { body: message, icon: "resources/other/icon.ico", onClick: function(event){ window.focus(); }, tag: "Chat Client" };
		var alertNotification = new Notification("Chat Client - " + sender, options);
	}
}

if (Notification.permission != "granted")
{
	Notification.requestPermission().then(permission => {
		if (permission == "granted")
		{
			console.log("Notifications request accepted.");
		}
		else
		{
			console.error("Notification request denied.");
		}
	});
}

window.onbeforeunload = function(){
  drone.publish({
    room: 'observable-room',
    message: "This user has disconnected.",
  });
};

window.addEventListener("focusin", function() {
	if (unread > 0)
	{
		unread = 0;
		document.getElementsByTagName("title")[0].innerText = "Chat Client - iMessage";
		document.getElementById("favicon").href = "resources/other/icon.ico";
	}
});

function toggleFullscreen() {
	var element = document.body;
	var isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;
	element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () { return false; };
	document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () { return false; };
	isFullscreen ? document.cancelFullScreen() : element.requestFullScreen();
}

function close_window() {
  if (confirm("Are you sure you want to quit?")) {
    window.close();
  }
}

function toggleUserDropdown() {
	var dropdown = document.getElementById("usersDropdown");
	var dropdowntext = document.getElementById("dropdown");
	if (dropdown.style.display == "none")
	{
		dropdown.style.display = "block";
		if (members.length == 1)
		{
			document.getElementsByClassName("members-count")[0].innerText = `${members.length} Person v`;
			document.getElementById("usersIcon").src = "resources/other/1person.png";
		}
		else if (members.length == 2)
		{
			document.getElementsByClassName("members-count")[0].innerText = `${members.length} People v`;
			document.getElementById("usersIcon").src = "resources/other/2people.png";
		}
		else if (members.length == 3 || members.length > 3)
		{
			document.getElementsByClassName("members-count")[0].innerText = `${members.length} People v`;
			document.getElementById("usersIcon").src = "resources/other/3people.png";
		}
	}
	else if (dropdown.style.display == "block")
	{
		dropdown.style.display = "none";
		if (members.length == 1)
		{
			document.getElementsByClassName("members-count")[0].innerText = `${members.length} Person >`;
			document.getElementById("usersIcon").src = "resources/other/1person.png";
		}
		else if (members.length == 2)
		{
			document.getElementsByClassName("members-count")[0].innerText = `${members.length} People >`;
			document.getElementById("usersIcon").src = "resources/other/2people.png";
		}
		else if (members.length == 3 || members.length > 3)
		{
			document.getElementsByClassName("members-count")[0].innerText = `${members.length} People >`;
			document.getElementById("usersIcon").src = "resources/other/3people.png";
		}
	}
}

function checkDropdown() 
{
	if (dropdown.style.display == "block")
	{
		toggleUserDropdown();
	}
}

responsiveChat('.messages');
dropdown.style.display = "none";
