(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/**
 * Created by adamjohansson on 2016-10-17.
 */

module.exports = {
  infoMessage: infoMessage
};

// Gets buttons from DOM
var memoryBtn = document.getElementById('memoryBtn');
var chatBtn = document.getElementById('chatBtn');
var videoBtn = document.getElementById('videoBtn');

memoryBtn.className = 'memoryBtn';
chatBtn.className = 'chatBtn';
videoBtn.className = 'videoBtn';

var memory = require('./memory');
var chat = require('./chat');
var video = require('./video');

/*
  Appends appropriate method calls on button-click.
 */
memoryBtn.addEventListener('click', function () {
    memory.createMemoryWindow();
});

chatBtn.addEventListener('click', function () {
  chat.createChatWindow();
});

videoBtn.addEventListener('click', function () {
  video.createVideoWindow();
});


/**
 * Method that creates an informative div with text of message.
 * @param button Button to append message to
 * @param message Message to display in div
 */
function infoMessage(button, message) {

  // If an infoDiv already exists, remove it (won't be visible because new will be created).
  if(document.getElementsByClassName("infoDiv").item(0) != null) {
    document.getElementsByClassName("infoDiv").item(0).remove();
  }

  /*
    Create div + X-button and append info to them.
  */
  var infoDiv = document.createElement('div');
  var xBtn = document.createElement('button');
  xBtn.classList.add('xBtn', 'info');
  xBtn.textContent = 'x';

  var label = document.createElement('label');
  infoDiv.classList = 'infoDiv';
  infoDiv.classList.add(button.className);

  label.textContent = message;

  infoDiv.style.top = (button.offsetTop);
  infoDiv.style.left = (button.offsetLeft);

  // Remove div on xBtn press.
  xBtn.addEventListener('mousedown', function () {
    xBtn.parentNode.parentNode.removeChild(xBtn.parentNode);
  });

  infoDiv.appendChild(xBtn);
  infoDiv.appendChild(label);
  document.getElementById('windowSection').appendChild(infoDiv);

  // After 3 seconds, fade out div.
  setTimeout(function() {
    fade(infoDiv);
  }, 3000);
}

/**
 * Fades out an element
 * @param element Element to fade out
 */
function fade(element) {
  var op = 1;  // initial opacity
  var timer = setInterval(function () {
    if (op <= 0.1){
      clearInterval(timer);
      element.style.display = 'none';
    }
    element.style.opacity = op;
    element.style.filter = 'alpha(opacity=' + op * 100 + ")";
    op -= op * 0.1;
  }, 50);
}


},{"./chat":2,"./memory":3,"./video":4}],2:[function(require,module,exports){
"use strict";

/**
 * Created by adamjohansson on 2016-10-18.
 */

module.exports = {
  createChatWindow: createChatWindow
};

var windows = require('./windows');

var serverAddr = 'ws://vhost3.lnu.se:20080/socket/';
var apiKey = 'eDBE76deU7L0H9mEBgxUKVR0VCnq0XBd';
var socket = new WebSocket(serverAddr, "protocolOne");

var username;
var storedMessages = [];

/**
 * Create a basic chat window, using method frmo Windows
 */
function createChatWindow() {

  var win = windows.createWindow('Chat');
  win.classList.add('chat');

  usernameCheck(win);

  createLayout(win);

  handleRequests();

}

/**
 * Create layout of window
 * @param win Window to create layout for
 */
function createLayout(win) {

  var sendArea = document.createElement('textarea');
  var messagesArea = document.createElement('textarea');

  var connectedLabel = document.createElement('label');
  connectedLabel.className = 'connectedLabel';

  if(socket.readyState == 1) {
    connectedLabel.textContent = 'You are connected to the chat!'
  }
  else {
    connectedLabel.textContent = 'There was an error connecting to the chat service.';
  }


  var sendForm = document.createElement('form');
  sendForm.appendChild(sendArea);

  messagesArea.readOnly = true;

  storedMessages = JSON.parse(localStorage.getItem('messages'));

  // append stored messages to chat, if there are any
  if(storedMessages != null) {
    var i;
    for(i=0; i<storedMessages.length; i++) {
      messagesArea.textContent += storedMessages[i];
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  }

  sendArea.classList.add('sendArea');
  messagesArea.classList.add('messagesArea');

  win.appendChild(sendForm);
  win.appendChild(messagesArea);
  win.appendChild(connectedLabel);

  // Send on Enter press
  sendForm.addEventListener('keypress', function (e) {
    var currentArea = this.firstElementChild;
    var key = e.which || e.keyCode;
    if (key === 13) { // 13 is enter

      var msg = {
        type: "message",
        data: currentArea.value,
        username: username,
       /* channel: 'channel', */
        key: apiKey
      };
      if(currentArea.value != '') {
        socket.send(JSON.stringify(msg)); // Wont send empty messages
      }

      sendForm.reset();
      e.preventDefault(); // dont add new row to textfield on Enter.
    }
  });
}

/**
 * Handle when messages are received.
 */
function handleRequests() {

  var nodes = document.getElementsByClassName('messagesArea');

  socket.onmessage = function (event) {

    var obj = JSON.parse(event.data);
    if(obj.type === 'message') {
      var currentTime = new Date();
      var hours = currentTime.getHours();
      var minutes = currentTime.getMinutes();
      if(hours < 10) {
        hours = '0' + hours;
      }
      if(minutes < 10) {
        minutes = '0' + minutes;
      }
      var msgToSend = ('[' + hours + ':' + minutes + '] ' + obj.username + ': ' + obj.data + '\n');

      if(storedMessages != null) {
        if (storedMessages.length == 20) {
          storedMessages.shift();
        }

        storedMessages.push(msgToSend);
      }
      else {
        storedMessages = [msgToSend];
      }

      // Save messsage to localstorage
      localStorage.setItem('messages', JSON.stringify(storedMessages));


      // Scroll down automatically
      var i;
      for(i=0; i<nodes.length; i++) {
        nodes.item(i).textContent += msgToSend;
        nodes.item(i).scrollTop = nodes.item(i).scrollHeight;
      }

    }
    else if(obj.type === 'heartbeat') {

    }

    updateTime();
  }
}

/**
 * Update current time
 */
function updateTime() {
  var currentTime = new Date();
  var lbls = document.getElementsByClassName('connectedLabel');

  var i;
  for(i=0; i<lbls.length; i++) {

    lbls.item(i).textContent = 'Connected. Updated ' + currentTime.getHours() + ":"
      + currentTime.getMinutes() + ":"
      + currentTime.getSeconds();
  }
}

/**
 * Check username
 * @param win Window to check for username
 */
function usernameCheck(win) {

  var usernameLabel = document.createElement('label');
  usernameLabel.className = 'usernameLabel';
  win.appendChild(usernameLabel);


  if(localStorage.getItem('username') != null) {
    username = localStorage.getItem('username');
    usernameLabel.textContent = 'Logged in as: ' + username;
  }
  else {
    var form = document.createElement('form');
    form.classList = 'userNameForm';

    var input = document.createElement('input');
    input.onkeypress = checkEnter;


    var btn = document.createElement('button');
    var label = document.createElement('label');

    input.setAttribute('type', 'text');
    btn.setAttribute('type', 'Button');
    btn.textContent = 'Submit';
    label.textContent = 'Set username: ';

    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(btn);

    btn.addEventListener('click', function () {

      if(input.value != null) {
        username = input.value;
        localStorage.setItem('username', username);
        form.parentNode.removeChild(form);

        var lbls = document.getElementsByClassName('usernameLabel');
        var i;
        for(i=0; i<lbls.length; i++) {
          lbls.item(i).textContent = 'Logged in as: ' + username;
        }
      }

    });


    win.appendChild(form);
  }
}

/**
 * If enter is pressed, disable default
 * @param e Key pressed
 */
function checkEnter(e) {
if(e.keyCode == 13) {
  e.preventDefault();
}
}

},{"./windows":5}],3:[function(require,module,exports){
"use strict";

/**
 * Created by adamjohansson on 2016-10-17.
 */

module.exports = {
  createMemoryWindow: createMemoryWindow
};

var windows = require('./windows');

// All available memory pics
var memoryPics = ['orianna','karma','morgana', 'annie', 'braum', 'fizz', 'jinx', 'varus', 'sona', 'ekko'];
var selectedSize;

/**
 * Create a bassic memory window, using Windows
 */
function createMemoryWindow() {

  var winProperties = {
    win: windows.createWindow('Memory'),
    currentlyFlippedCards: 0,
    timeoutDone: true,
    cardToCompare: ''
  };

  createSettingsBar(winProperties);

  createCards(winProperties);
  keyboardOpt(winProperties.win);
}

/**
 * Create cards for memory Window
 * @param winProperties Window and its properties
 */
function createCards(winProperties) {

  var selector = winProperties.win.getElementsByClassName('settings').item(0).firstChild;
  var val = selector.options[selector.selectedIndex].text;

  // Size of memory
  if(val == '3 x 4') {
    selectedSize = 6;
  }
  else if(val == '4 x 4') {
    selectedSize = 8;
  }
  else {
    selectedSize = 10;
  }

  winProperties.win.setAttribute('currentSize', val);

  var i;
  var j;
  var currentCards = [];
  for(j=0; j<2; j++) {
    for(i=0; i<selectedSize; i++) {   // selected size is ammount of cards from memoryPics
      currentCards.push(memoryPics[i]); // add copies of cards
    }
  }
  // Shuffle the cards
  currentCards = shuffle(currentCards);
  var card;
  var i;
    for (i = 0; i < currentCards.length; i++) {
      card = document.createElement('button');
      card.classList.add('card');
      card.classList.add(currentCards[i]);

      winProperties.win.appendChild(card);

      card.addEventListener('click', function () {

        var currentBtn = this;

        // Only flip card if it is not already visible
        if (!currentBtn.classList.contains('visible') && winProperties.timeoutDone) {

          currentBtn.classList.toggle('visible');

          winProperties.currentlyFlippedCards++;

          // No card to compare exist, flip this card and wait for next.
          if (winProperties.currentlyFlippedCards == 1) {
            winProperties.cardToCompare = currentBtn;
          }

          // Card to compare exists. If they are same continue with both flipped, else reset both cards.
          else if (winProperties.currentlyFlippedCards == 2) {
            if (winProperties.cardToCompare.className == currentBtn.className) {
            }
            else {
              winProperties.timeoutDone = false;
              setTimeout(function () {
                winProperties.cardToCompare.classList.toggle('visible');
                currentBtn.classList.toggle('visible');
                winProperties.timeoutDone = true;
              }, 1000);
            }

       //     winProperties.cardToCompare = null;
            winProperties.currentlyFlippedCards = 0;
          }
        }

      });

    }
}

/**
 * Shuffle positions of sent in array.
 * @param array Array to shuffle
 * @returns array Shuffeled array
 */
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

/**
 * Add keyboard functionality to the game. Game will be playable with arrows.
 * @param win Window to add functionality
 */
function keyboardOpt(win) {
win.addEventListener('keydown', function (event) {
  var focused = document.activeElement;
  var next;

  if (event.keyCode == 37) {  // left arrow
    try {
      next = focused.previousElementSibling;
    } catch (nullPointerException) {}
  }

  else if(event.keyCode == 38) {  // down arrow
    try {
      next = focused.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling;
    } catch (nullPointerException) {}
  }

  else if(event.keyCode == 39) {  // right arrow
    try {
      next = focused.nextElementSibling
    } catch (nullPointerException) {}
  }

  else if(event.keyCode == 40) {  // down arrow
    try {
      next = focused.nextElementSibling.nextElementSibling.nextElementSibling.nextElementSibling;
    } catch (nullPointerException) {}
  }

  if(next != null) {
    next.focus();
  }
  });

}

/**
 * Add settings bar to window.
 * @param winProperties Window and its properties
 */
function createSettingsBar(winProperties) {

  var settingsDiv = document.createElement('div');
  settingsDiv.className = 'settings';

  var reloadBtn = document.createElement('button');
  var select = document.createElement('select');

  reloadBtn.textContent = 'Reload';

  var option1 = document.createElement('option');
  var option2 = document.createElement('option');
  var option3 = document.createElement('option');

  option1.textContent = '3 x 4';
  option2.textContent = '4 x 4';
  option3.textContent = '4 x 5';

  select.appendChild(option1);
  select.appendChild(option2);
  select.appendChild(option3);

  select.selectedIndex = 1;

  reloadBtn.addEventListener('click', function () {
    var currentWin = this.parentNode.parentNode;
    var cards = currentWin.getElementsByClassName('card');

    var i;
    var l = cards.length;
    for(i=0; i<l; i++){
      cards.item(0).parentNode.removeChild(cards.item(0));
    }

    winProperties.currentlyFlippedCards = 0;
    winProperties.timeoutDone = true;
    winProperties.cardToCompare = '';

    createCards(winProperties);
  });

  settingsDiv.appendChild(select);
  settingsDiv.appendChild(reloadBtn);
  winProperties.win.appendChild(settingsDiv);

}


},{"./windows":5}],4:[function(require,module,exports){
"use strict";

/**
 * Created by adamjohansson on 2016-10-19.
 */

module.exports = {
  createVideoWindow: createVideoWindow
};

var windows = require('./windows');
var app = require('./app');

var maxWindows = 5;
var currentWindows = 0;

/*
  IDs of the videos.
 */
var vid1ID = 'vzHrjOMfHPY';
var vid2ID = '0nlJuwO0GDs';
var vid3ID = 'tEnsqpThaFg';
var vid4ID = 'fmI_Ndrxy14';
var vid5ID = 'FtEpp9lkfxA';

var mainVideo;

/**
 * Creates a video Window. Calls Windows class to create Window, then appends video info to it.
 */
function createVideoWindow() {

  // Only 5 video windows are allowed at the same time
  if(currentWindows != 5) {

    currentWindows++;

    // Creates a basic window
    var win = windows.createWindow('Cinematics');
    win.classList.add('videoWindow');

    mainVideo = document.createElement('iframe');

    var playlist = document.createElement('div');
    playlist.className = 'playlist';

    // Creates all the buttons
    var vid1Btn = document.createElement('button');
    var vid2Btn = document.createElement('button');
    var vid3Btn = document.createElement('button');
    var vid4Btn = document.createElement('button');
    var vid5Btn = document.createElement('button');

    vid1Btn.className = 'vid1Btn';
    vid2Btn.className = 'vid2Btn';
    vid3Btn.className = 'vid3Btn';
    vid4Btn.className = 'vid4Btn';
    vid5Btn.className = 'vid5Btn';

    // Appends method to change main video on button-click
    vid1Btn.addEventListener('click', function () {
      var currentMainVid = this.parentNode.previousSibling;
      changeMainVideo(vid1ID, currentMainVid);
    });
    vid2Btn.addEventListener('click', function () {
      var currentMainVid = this.parentNode.previousSibling;
      changeMainVideo(vid2ID, currentMainVid);
    });
    vid3Btn.addEventListener('click', function () {
      var currentMainVid = this.parentNode.previousSibling;
      changeMainVideo(vid3ID, currentMainVid);
    });
    vid4Btn.addEventListener('click', function () {
      var currentMainVid = this.parentNode.previousSibling;
      changeMainVideo(vid4ID, currentMainVid);
    });
    vid5Btn.addEventListener('click', function () {
      var currentMainVid = this.parentNode.previousSibling;
      changeMainVideo(vid5ID, currentMainVid);
    });

    // Appends buttons to "playlist"-div
    playlist.appendChild(vid1Btn);
    playlist.appendChild(vid2Btn);
    playlist.appendChild(vid3Btn);
    playlist.appendChild(vid4Btn);
    playlist.appendChild(vid5Btn);

    win.appendChild(mainVideo);

    win.appendChild(playlist);

    // Set main video to vid1Btns video
    changeMainVideo(vid1ID, vid1Btn.parentNode.previousSibling);

    /*
      When windows xBtn is pressed, currentWindows counter is reduced by 1
      (and Window is closed, see Windows Class).
     */
    win.getElementsByClassName('xBtn').item(0).addEventListener('mousedown', function () {
      currentWindows--;
    });

  }
  // If more than 5 windows are open, call app method to display info message.
  else {
    app.infoMessage(document.getElementById('videoBtn'), 'You can only have 5 video windows open at the same time.')
  }
}
/**
 * Change the main video of the window
 * @param id ID of the video
 * @param currentMainVid Current main video
 */
function changeMainVideo(id, currentMainVid) {
  currentMainVid.setAttribute('src', 'https://www.youtube.com/embed/' + id);
  currentMainVid.setAttribute('allowfullscreen', '');
}

},{"./app":1,"./windows":5}],5:[function(require,module,exports){
"use strict";

/**
 * Created by adamjohansson on 2016-10-17.
 */

module.exports = {
  createWindow: createWindow
};

var windowSection = document.getElementById('windowSection');

// Stores x & y coordinates of the mouse pointer.
var x_pos = 0, y_pos = 0;

// Z-value of focused window.
var currentZ = 0;

var currentWin = null;

var x_elem;
var y_elem;
var startY;

/**
 * Method to create a simple empty window
 * @param type Type of window, used for display at the top of the window.
 * @returns {Element} Window created
 */
function createWindow(type) {

  var win = document.createElement('section');

  // Window is created at x_pos and y_pos
  win.style.left = x_pos + 'px';
  win.style.top = y_pos + 'px';

  // If x_pos or y_pos are larger than the size of window, it is reset.
  if(x_pos >= (window.innerWidth - 200)) {
    x_pos = 5;
  }
  if(y_pos >= (window.innerHeight - 200)) {
    y_pos = 5;
  }

  /*
    Creates elements for the window and adds info to them.
   */
  var dragSection = document.createElement('section');
  var xBtn = document.createElement('button');

  dragSection.textContent = type;
  xBtn.textContent = 'X';

  win.className = 'window';
  dragSection.className = 'dragSection';
  xBtn.className = 'xBtn';

  /*
    When a window is clicked (mousedown), it is put on top in the DOM (highest Z-index).
   */
  win.addEventListener('mousedown', function() {
    this.style.zIndex = currentZ++;
  });

  /*
    When the dragsection is "mousedown:ed", its window is able to be moved using winMoe.
   */
  dragSection.addEventListener('mousedown', function (e) {

    currentWin = this;

    currentWin.startY = currentWin.clientY;
    window.addEventListener('mousemove', winMove, true);

    currentWin.x_elem = event.clientX;
    currentWin.y_elem = event.clientY;
  });

  /*
    When the mouse is released anywhere, winMove is removed as a listener, and currentWin = null.
   */
  window.addEventListener('mouseup', function (event) {

    if(currentWin != null) {
      x_pos = currentWin.x_elem;
      y_pos = currentWin.y_elem;
    }

    currentWin = null;
    dragSection.removeEventListener('mousemove', winMove, true);
  });

  /**
   * Method to move Window e according to the mouse.
   * @param e Window to move
   */
  function winMove(e) {

    /*
      Get current position of mouse.
     */
    x_pos = document.all ? window.event.clientX : e.pageX;
    y_pos = document.all ? window.event.clientY : e.pageY;

    if(currentWin != null) {

      var newXpos = (x_pos - 150);
      var newYpos = (y_pos - 20);

      /*
        Window is not able to move across left boarder or top of page.
       */
      if(newXpos <= 0) {
        newXpos = 1;
      }
      if(newYpos <= 0) {
        newYpos = 1;
      }

      // Changes the position of the window.
      currentWin.parentNode.style.left = newXpos + 'px';
      currentWin.parentNode.style.top = newYpos + 'px';

    }
  }

  /*
    Removes window when the xBtn of it is "mousedown:ed".
   */
  xBtn.addEventListener('mousedown', function () {
    currentWin = null;
    xBtn.parentNode.parentNode.parentNode.removeChild(win);
  });

  // Adds offset for when next window is created.
  x_pos += 10;
  y_pos += 10;

  // Currentwindow is created in the top of the DOM (highest Z-index).
  win.style.zIndex = currentZ++;

  dragSection.appendChild(xBtn);
  win.appendChild(dragSection);
  windowSection.appendChild(win);

  return win;
}


},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjYuOC4xL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9jaGF0LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9tZW1vcnkuanMiLCJjbGllbnQvc291cmNlL2pzL3ZpZGVvLmpzIiwiY2xpZW50L3NvdXJjZS9qcy93aW5kb3dzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENyZWF0ZWQgYnkgYWRhbWpvaGFuc3NvbiBvbiAyMDE2LTEwLTE3LlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbmZvTWVzc2FnZTogaW5mb01lc3NhZ2Vcbn07XG5cbi8vIEdldHMgYnV0dG9ucyBmcm9tIERPTVxudmFyIG1lbW9yeUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW1vcnlCdG4nKTtcbnZhciBjaGF0QnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoYXRCdG4nKTtcbnZhciB2aWRlb0J0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWRlb0J0bicpO1xuXG5tZW1vcnlCdG4uY2xhc3NOYW1lID0gJ21lbW9yeUJ0bic7XG5jaGF0QnRuLmNsYXNzTmFtZSA9ICdjaGF0QnRuJztcbnZpZGVvQnRuLmNsYXNzTmFtZSA9ICd2aWRlb0J0bic7XG5cbnZhciBtZW1vcnkgPSByZXF1aXJlKCcuL21lbW9yeScpO1xudmFyIGNoYXQgPSByZXF1aXJlKCcuL2NoYXQnKTtcbnZhciB2aWRlbyA9IHJlcXVpcmUoJy4vdmlkZW8nKTtcblxuLypcbiAgQXBwZW5kcyBhcHByb3ByaWF0ZSBtZXRob2QgY2FsbHMgb24gYnV0dG9uLWNsaWNrLlxuICovXG5tZW1vcnlCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgbWVtb3J5LmNyZWF0ZU1lbW9yeVdpbmRvdygpO1xufSk7XG5cbmNoYXRCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gIGNoYXQuY3JlYXRlQ2hhdFdpbmRvdygpO1xufSk7XG5cbnZpZGVvQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICB2aWRlby5jcmVhdGVWaWRlb1dpbmRvdygpO1xufSk7XG5cblxuLyoqXG4gKiBNZXRob2QgdGhhdCBjcmVhdGVzIGFuIGluZm9ybWF0aXZlIGRpdiB3aXRoIHRleHQgb2YgbWVzc2FnZS5cbiAqIEBwYXJhbSBidXR0b24gQnV0dG9uIHRvIGFwcGVuZCBtZXNzYWdlIHRvXG4gKiBAcGFyYW0gbWVzc2FnZSBNZXNzYWdlIHRvIGRpc3BsYXkgaW4gZGl2XG4gKi9cbmZ1bmN0aW9uIGluZm9NZXNzYWdlKGJ1dHRvbiwgbWVzc2FnZSkge1xuXG4gIC8vIElmIGFuIGluZm9EaXYgYWxyZWFkeSBleGlzdHMsIHJlbW92ZSBpdCAod29uJ3QgYmUgdmlzaWJsZSBiZWNhdXNlIG5ldyB3aWxsIGJlIGNyZWF0ZWQpLlxuICBpZihkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaW5mb0RpdlwiKS5pdGVtKDApICE9IG51bGwpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaW5mb0RpdlwiKS5pdGVtKDApLnJlbW92ZSgpO1xuICB9XG5cbiAgLypcbiAgICBDcmVhdGUgZGl2ICsgWC1idXR0b24gYW5kIGFwcGVuZCBpbmZvIHRvIHRoZW0uXG4gICovXG4gIHZhciBpbmZvRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciB4QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gIHhCdG4uY2xhc3NMaXN0LmFkZCgneEJ0bicsICdpbmZvJyk7XG4gIHhCdG4udGV4dENvbnRlbnQgPSAneCc7XG5cbiAgdmFyIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgaW5mb0Rpdi5jbGFzc0xpc3QgPSAnaW5mb0Rpdic7XG4gIGluZm9EaXYuY2xhc3NMaXN0LmFkZChidXR0b24uY2xhc3NOYW1lKTtcblxuICBsYWJlbC50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG5cbiAgaW5mb0Rpdi5zdHlsZS50b3AgPSAoYnV0dG9uLm9mZnNldFRvcCk7XG4gIGluZm9EaXYuc3R5bGUubGVmdCA9IChidXR0b24ub2Zmc2V0TGVmdCk7XG5cbiAgLy8gUmVtb3ZlIGRpdiBvbiB4QnRuIHByZXNzLlxuICB4QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICB4QnRuLnBhcmVudE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh4QnRuLnBhcmVudE5vZGUpO1xuICB9KTtcblxuICBpbmZvRGl2LmFwcGVuZENoaWxkKHhCdG4pO1xuICBpbmZvRGl2LmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dpbmRvd1NlY3Rpb24nKS5hcHBlbmRDaGlsZChpbmZvRGl2KTtcblxuICAvLyBBZnRlciAzIHNlY29uZHMsIGZhZGUgb3V0IGRpdi5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBmYWRlKGluZm9EaXYpO1xuICB9LCAzMDAwKTtcbn1cblxuLyoqXG4gKiBGYWRlcyBvdXQgYW4gZWxlbWVudFxuICogQHBhcmFtIGVsZW1lbnQgRWxlbWVudCB0byBmYWRlIG91dFxuICovXG5mdW5jdGlvbiBmYWRlKGVsZW1lbnQpIHtcbiAgdmFyIG9wID0gMTsgIC8vIGluaXRpYWwgb3BhY2l0eVxuICB2YXIgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKG9wIDw9IDAuMSl7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG4gICAgZWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gb3A7XG4gICAgZWxlbWVudC5zdHlsZS5maWx0ZXIgPSAnYWxwaGEob3BhY2l0eT0nICsgb3AgKiAxMDAgKyBcIilcIjtcbiAgICBvcCAtPSBvcCAqIDAuMTtcbiAgfSwgNTApO1xufVxuXG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBDcmVhdGVkIGJ5IGFkYW1qb2hhbnNzb24gb24gMjAxNi0xMC0xOC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlQ2hhdFdpbmRvdzogY3JlYXRlQ2hhdFdpbmRvd1xufTtcblxudmFyIHdpbmRvd3MgPSByZXF1aXJlKCcuL3dpbmRvd3MnKTtcblxudmFyIHNlcnZlckFkZHIgPSAnd3M6Ly92aG9zdDMubG51LnNlOjIwMDgwL3NvY2tldC8nO1xudmFyIGFwaUtleSA9ICdlREJFNzZkZVU3TDBIOW1FQmd4VUtWUjBWQ25xMFhCZCc7XG52YXIgc29ja2V0ID0gbmV3IFdlYlNvY2tldChzZXJ2ZXJBZGRyLCBcInByb3RvY29sT25lXCIpO1xuXG52YXIgdXNlcm5hbWU7XG52YXIgc3RvcmVkTWVzc2FnZXMgPSBbXTtcblxuLyoqXG4gKiBDcmVhdGUgYSBiYXNpYyBjaGF0IHdpbmRvdywgdXNpbmcgbWV0aG9kIGZybW8gV2luZG93c1xuICovXG5mdW5jdGlvbiBjcmVhdGVDaGF0V2luZG93KCkge1xuXG4gIHZhciB3aW4gPSB3aW5kb3dzLmNyZWF0ZVdpbmRvdygnQ2hhdCcpO1xuICB3aW4uY2xhc3NMaXN0LmFkZCgnY2hhdCcpO1xuXG4gIHVzZXJuYW1lQ2hlY2sod2luKTtcblxuICBjcmVhdGVMYXlvdXQod2luKTtcblxuICBoYW5kbGVSZXF1ZXN0cygpO1xuXG59XG5cbi8qKlxuICogQ3JlYXRlIGxheW91dCBvZiB3aW5kb3dcbiAqIEBwYXJhbSB3aW4gV2luZG93IHRvIGNyZWF0ZSBsYXlvdXQgZm9yXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUxheW91dCh3aW4pIHtcblxuICB2YXIgc2VuZEFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICB2YXIgbWVzc2FnZXNBcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcblxuICB2YXIgY29ubmVjdGVkTGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICBjb25uZWN0ZWRMYWJlbC5jbGFzc05hbWUgPSAnY29ubmVjdGVkTGFiZWwnO1xuXG4gIGlmKHNvY2tldC5yZWFkeVN0YXRlID09IDEpIHtcbiAgICBjb25uZWN0ZWRMYWJlbC50ZXh0Q29udGVudCA9ICdZb3UgYXJlIGNvbm5lY3RlZCB0byB0aGUgY2hhdCEnXG4gIH1cbiAgZWxzZSB7XG4gICAgY29ubmVjdGVkTGFiZWwudGV4dENvbnRlbnQgPSAnVGhlcmUgd2FzIGFuIGVycm9yIGNvbm5lY3RpbmcgdG8gdGhlIGNoYXQgc2VydmljZS4nO1xuICB9XG5cblxuICB2YXIgc2VuZEZvcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG4gIHNlbmRGb3JtLmFwcGVuZENoaWxkKHNlbmRBcmVhKTtcblxuICBtZXNzYWdlc0FyZWEucmVhZE9ubHkgPSB0cnVlO1xuXG4gIHN0b3JlZE1lc3NhZ2VzID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnbWVzc2FnZXMnKSk7XG5cbiAgLy8gYXBwZW5kIHN0b3JlZCBtZXNzYWdlcyB0byBjaGF0LCBpZiB0aGVyZSBhcmUgYW55XG4gIGlmKHN0b3JlZE1lc3NhZ2VzICE9IG51bGwpIHtcbiAgICB2YXIgaTtcbiAgICBmb3IoaT0wOyBpPHN0b3JlZE1lc3NhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBtZXNzYWdlc0FyZWEudGV4dENvbnRlbnQgKz0gc3RvcmVkTWVzc2FnZXNbaV07XG4gICAgICBtZXNzYWdlc0FyZWEuc2Nyb2xsVG9wID0gbWVzc2FnZXNBcmVhLnNjcm9sbEhlaWdodDtcbiAgICB9XG4gIH1cblxuICBzZW5kQXJlYS5jbGFzc0xpc3QuYWRkKCdzZW5kQXJlYScpO1xuICBtZXNzYWdlc0FyZWEuY2xhc3NMaXN0LmFkZCgnbWVzc2FnZXNBcmVhJyk7XG5cbiAgd2luLmFwcGVuZENoaWxkKHNlbmRGb3JtKTtcbiAgd2luLmFwcGVuZENoaWxkKG1lc3NhZ2VzQXJlYSk7XG4gIHdpbi5hcHBlbmRDaGlsZChjb25uZWN0ZWRMYWJlbCk7XG5cbiAgLy8gU2VuZCBvbiBFbnRlciBwcmVzc1xuICBzZW5kRm9ybS5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGN1cnJlbnRBcmVhID0gdGhpcy5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICB2YXIga2V5ID0gZS53aGljaCB8fCBlLmtleUNvZGU7XG4gICAgaWYgKGtleSA9PT0gMTMpIHsgLy8gMTMgaXMgZW50ZXJcblxuICAgICAgdmFyIG1zZyA9IHtcbiAgICAgICAgdHlwZTogXCJtZXNzYWdlXCIsXG4gICAgICAgIGRhdGE6IGN1cnJlbnRBcmVhLnZhbHVlLFxuICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICAgLyogY2hhbm5lbDogJ2NoYW5uZWwnLCAqL1xuICAgICAgICBrZXk6IGFwaUtleVxuICAgICAgfTtcbiAgICAgIGlmKGN1cnJlbnRBcmVhLnZhbHVlICE9ICcnKSB7XG4gICAgICAgIHNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KG1zZykpOyAvLyBXb250IHNlbmQgZW1wdHkgbWVzc2FnZXNcbiAgICAgIH1cblxuICAgICAgc2VuZEZvcm0ucmVzZXQoKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTsgLy8gZG9udCBhZGQgbmV3IHJvdyB0byB0ZXh0ZmllbGQgb24gRW50ZXIuXG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBIYW5kbGUgd2hlbiBtZXNzYWdlcyBhcmUgcmVjZWl2ZWQuXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZVJlcXVlc3RzKCkge1xuXG4gIHZhciBub2RlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21lc3NhZ2VzQXJlYScpO1xuXG4gIHNvY2tldC5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgIHZhciBvYmogPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuICAgIGlmKG9iai50eXBlID09PSAnbWVzc2FnZScpIHtcbiAgICAgIHZhciBjdXJyZW50VGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICB2YXIgaG91cnMgPSBjdXJyZW50VGltZS5nZXRIb3VycygpO1xuICAgICAgdmFyIG1pbnV0ZXMgPSBjdXJyZW50VGltZS5nZXRNaW51dGVzKCk7XG4gICAgICBpZihob3VycyA8IDEwKSB7XG4gICAgICAgIGhvdXJzID0gJzAnICsgaG91cnM7XG4gICAgICB9XG4gICAgICBpZihtaW51dGVzIDwgMTApIHtcbiAgICAgICAgbWludXRlcyA9ICcwJyArIG1pbnV0ZXM7XG4gICAgICB9XG4gICAgICB2YXIgbXNnVG9TZW5kID0gKCdbJyArIGhvdXJzICsgJzonICsgbWludXRlcyArICddICcgKyBvYmoudXNlcm5hbWUgKyAnOiAnICsgb2JqLmRhdGEgKyAnXFxuJyk7XG5cbiAgICAgIGlmKHN0b3JlZE1lc3NhZ2VzICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHN0b3JlZE1lc3NhZ2VzLmxlbmd0aCA9PSAyMCkge1xuICAgICAgICAgIHN0b3JlZE1lc3NhZ2VzLnNoaWZ0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBzdG9yZWRNZXNzYWdlcy5wdXNoKG1zZ1RvU2VuZCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgc3RvcmVkTWVzc2FnZXMgPSBbbXNnVG9TZW5kXTtcbiAgICAgIH1cblxuICAgICAgLy8gU2F2ZSBtZXNzc2FnZSB0byBsb2NhbHN0b3JhZ2VcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdtZXNzYWdlcycsIEpTT04uc3RyaW5naWZ5KHN0b3JlZE1lc3NhZ2VzKSk7XG5cblxuICAgICAgLy8gU2Nyb2xsIGRvd24gYXV0b21hdGljYWxseVxuICAgICAgdmFyIGk7XG4gICAgICBmb3IoaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5vZGVzLml0ZW0oaSkudGV4dENvbnRlbnQgKz0gbXNnVG9TZW5kO1xuICAgICAgICBub2Rlcy5pdGVtKGkpLnNjcm9sbFRvcCA9IG5vZGVzLml0ZW0oaSkuc2Nyb2xsSGVpZ2h0O1xuICAgICAgfVxuXG4gICAgfVxuICAgIGVsc2UgaWYob2JqLnR5cGUgPT09ICdoZWFydGJlYXQnKSB7XG5cbiAgICB9XG5cbiAgICB1cGRhdGVUaW1lKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgY3VycmVudCB0aW1lXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVRpbWUoKSB7XG4gIHZhciBjdXJyZW50VGltZSA9IG5ldyBEYXRlKCk7XG4gIHZhciBsYmxzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY29ubmVjdGVkTGFiZWwnKTtcblxuICB2YXIgaTtcbiAgZm9yKGk9MDsgaTxsYmxzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICBsYmxzLml0ZW0oaSkudGV4dENvbnRlbnQgPSAnQ29ubmVjdGVkLiBVcGRhdGVkICcgKyBjdXJyZW50VGltZS5nZXRIb3VycygpICsgXCI6XCJcbiAgICAgICsgY3VycmVudFRpbWUuZ2V0TWludXRlcygpICsgXCI6XCJcbiAgICAgICsgY3VycmVudFRpbWUuZ2V0U2Vjb25kcygpO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgdXNlcm5hbWVcbiAqIEBwYXJhbSB3aW4gV2luZG93IHRvIGNoZWNrIGZvciB1c2VybmFtZVxuICovXG5mdW5jdGlvbiB1c2VybmFtZUNoZWNrKHdpbikge1xuXG4gIHZhciB1c2VybmFtZUxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgdXNlcm5hbWVMYWJlbC5jbGFzc05hbWUgPSAndXNlcm5hbWVMYWJlbCc7XG4gIHdpbi5hcHBlbmRDaGlsZCh1c2VybmFtZUxhYmVsKTtcblxuXG4gIGlmKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VybmFtZScpICE9IG51bGwpIHtcbiAgICB1c2VybmFtZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VybmFtZScpO1xuICAgIHVzZXJuYW1lTGFiZWwudGV4dENvbnRlbnQgPSAnTG9nZ2VkIGluIGFzOiAnICsgdXNlcm5hbWU7XG4gIH1cbiAgZWxzZSB7XG4gICAgdmFyIGZvcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG4gICAgZm9ybS5jbGFzc0xpc3QgPSAndXNlck5hbWVGb3JtJztcblxuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgaW5wdXQub25rZXlwcmVzcyA9IGNoZWNrRW50ZXI7XG5cblxuICAgIHZhciBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICB2YXIgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuXG4gICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcbiAgICBidG4uc2V0QXR0cmlidXRlKCd0eXBlJywgJ0J1dHRvbicpO1xuICAgIGJ0bi50ZXh0Q29udGVudCA9ICdTdWJtaXQnO1xuICAgIGxhYmVsLnRleHRDb250ZW50ID0gJ1NldCB1c2VybmFtZTogJztcblxuICAgIGZvcm0uYXBwZW5kQ2hpbGQobGFiZWwpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgIGZvcm0uYXBwZW5kQ2hpbGQoYnRuKTtcblxuICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcblxuICAgICAgaWYoaW5wdXQudmFsdWUgIT0gbnVsbCkge1xuICAgICAgICB1c2VybmFtZSA9IGlucHV0LnZhbHVlO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcm5hbWUnLCB1c2VybmFtZSk7XG4gICAgICAgIGZvcm0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmb3JtKTtcblxuICAgICAgICB2YXIgbGJscyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3VzZXJuYW1lTGFiZWwnKTtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvcihpPTA7IGk8bGJscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGxibHMuaXRlbShpKS50ZXh0Q29udGVudCA9ICdMb2dnZWQgaW4gYXM6ICcgKyB1c2VybmFtZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfSk7XG5cblxuICAgIHdpbi5hcHBlbmRDaGlsZChmb3JtKTtcbiAgfVxufVxuXG4vKipcbiAqIElmIGVudGVyIGlzIHByZXNzZWQsIGRpc2FibGUgZGVmYXVsdFxuICogQHBhcmFtIGUgS2V5IHByZXNzZWRcbiAqL1xuZnVuY3Rpb24gY2hlY2tFbnRlcihlKSB7XG5pZihlLmtleUNvZGUgPT0gMTMpIHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xufVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogQ3JlYXRlZCBieSBhZGFtam9oYW5zc29uIG9uIDIwMTYtMTAtMTcuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNyZWF0ZU1lbW9yeVdpbmRvdzogY3JlYXRlTWVtb3J5V2luZG93XG59O1xuXG52YXIgd2luZG93cyA9IHJlcXVpcmUoJy4vd2luZG93cycpO1xuXG4vLyBBbGwgYXZhaWxhYmxlIG1lbW9yeSBwaWNzXG52YXIgbWVtb3J5UGljcyA9IFsnb3JpYW5uYScsJ2thcm1hJywnbW9yZ2FuYScsICdhbm5pZScsICdicmF1bScsICdmaXp6JywgJ2ppbngnLCAndmFydXMnLCAnc29uYScsICdla2tvJ107XG52YXIgc2VsZWN0ZWRTaXplO1xuXG4vKipcbiAqIENyZWF0ZSBhIGJhc3NpYyBtZW1vcnkgd2luZG93LCB1c2luZyBXaW5kb3dzXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU1lbW9yeVdpbmRvdygpIHtcblxuICB2YXIgd2luUHJvcGVydGllcyA9IHtcbiAgICB3aW46IHdpbmRvd3MuY3JlYXRlV2luZG93KCdNZW1vcnknKSxcbiAgICBjdXJyZW50bHlGbGlwcGVkQ2FyZHM6IDAsXG4gICAgdGltZW91dERvbmU6IHRydWUsXG4gICAgY2FyZFRvQ29tcGFyZTogJydcbiAgfTtcblxuICBjcmVhdGVTZXR0aW5nc0Jhcih3aW5Qcm9wZXJ0aWVzKTtcblxuICBjcmVhdGVDYXJkcyh3aW5Qcm9wZXJ0aWVzKTtcbiAga2V5Ym9hcmRPcHQod2luUHJvcGVydGllcy53aW4pO1xufVxuXG4vKipcbiAqIENyZWF0ZSBjYXJkcyBmb3IgbWVtb3J5IFdpbmRvd1xuICogQHBhcmFtIHdpblByb3BlcnRpZXMgV2luZG93IGFuZCBpdHMgcHJvcGVydGllc1xuICovXG5mdW5jdGlvbiBjcmVhdGVDYXJkcyh3aW5Qcm9wZXJ0aWVzKSB7XG5cbiAgdmFyIHNlbGVjdG9yID0gd2luUHJvcGVydGllcy53aW4uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc2V0dGluZ3MnKS5pdGVtKDApLmZpcnN0Q2hpbGQ7XG4gIHZhciB2YWwgPSBzZWxlY3Rvci5vcHRpb25zW3NlbGVjdG9yLnNlbGVjdGVkSW5kZXhdLnRleHQ7XG5cbiAgLy8gU2l6ZSBvZiBtZW1vcnlcbiAgaWYodmFsID09ICczIHggNCcpIHtcbiAgICBzZWxlY3RlZFNpemUgPSA2O1xuICB9XG4gIGVsc2UgaWYodmFsID09ICc0IHggNCcpIHtcbiAgICBzZWxlY3RlZFNpemUgPSA4O1xuICB9XG4gIGVsc2Uge1xuICAgIHNlbGVjdGVkU2l6ZSA9IDEwO1xuICB9XG5cbiAgd2luUHJvcGVydGllcy53aW4uc2V0QXR0cmlidXRlKCdjdXJyZW50U2l6ZScsIHZhbCk7XG5cbiAgdmFyIGk7XG4gIHZhciBqO1xuICB2YXIgY3VycmVudENhcmRzID0gW107XG4gIGZvcihqPTA7IGo8MjsgaisrKSB7XG4gICAgZm9yKGk9MDsgaTxzZWxlY3RlZFNpemU7IGkrKykgeyAgIC8vIHNlbGVjdGVkIHNpemUgaXMgYW1tb3VudCBvZiBjYXJkcyBmcm9tIG1lbW9yeVBpY3NcbiAgICAgIGN1cnJlbnRDYXJkcy5wdXNoKG1lbW9yeVBpY3NbaV0pOyAvLyBhZGQgY29waWVzIG9mIGNhcmRzXG4gICAgfVxuICB9XG4gIC8vIFNodWZmbGUgdGhlIGNhcmRzXG4gIGN1cnJlbnRDYXJkcyA9IHNodWZmbGUoY3VycmVudENhcmRzKTtcbiAgdmFyIGNhcmQ7XG4gIHZhciBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBjdXJyZW50Q2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNhcmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGNhcmQuY2xhc3NMaXN0LmFkZCgnY2FyZCcpO1xuICAgICAgY2FyZC5jbGFzc0xpc3QuYWRkKGN1cnJlbnRDYXJkc1tpXSk7XG5cbiAgICAgIHdpblByb3BlcnRpZXMud2luLmFwcGVuZENoaWxkKGNhcmQpO1xuXG4gICAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHZhciBjdXJyZW50QnRuID0gdGhpcztcblxuICAgICAgICAvLyBPbmx5IGZsaXAgY2FyZCBpZiBpdCBpcyBub3QgYWxyZWFkeSB2aXNpYmxlXG4gICAgICAgIGlmICghY3VycmVudEJ0bi5jbGFzc0xpc3QuY29udGFpbnMoJ3Zpc2libGUnKSAmJiB3aW5Qcm9wZXJ0aWVzLnRpbWVvdXREb25lKSB7XG5cbiAgICAgICAgICBjdXJyZW50QnRuLmNsYXNzTGlzdC50b2dnbGUoJ3Zpc2libGUnKTtcblxuICAgICAgICAgIHdpblByb3BlcnRpZXMuY3VycmVudGx5RmxpcHBlZENhcmRzKys7XG5cbiAgICAgICAgICAvLyBObyBjYXJkIHRvIGNvbXBhcmUgZXhpc3QsIGZsaXAgdGhpcyBjYXJkIGFuZCB3YWl0IGZvciBuZXh0LlxuICAgICAgICAgIGlmICh3aW5Qcm9wZXJ0aWVzLmN1cnJlbnRseUZsaXBwZWRDYXJkcyA9PSAxKSB7XG4gICAgICAgICAgICB3aW5Qcm9wZXJ0aWVzLmNhcmRUb0NvbXBhcmUgPSBjdXJyZW50QnRuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENhcmQgdG8gY29tcGFyZSBleGlzdHMuIElmIHRoZXkgYXJlIHNhbWUgY29udGludWUgd2l0aCBib3RoIGZsaXBwZWQsIGVsc2UgcmVzZXQgYm90aCBjYXJkcy5cbiAgICAgICAgICBlbHNlIGlmICh3aW5Qcm9wZXJ0aWVzLmN1cnJlbnRseUZsaXBwZWRDYXJkcyA9PSAyKSB7XG4gICAgICAgICAgICBpZiAod2luUHJvcGVydGllcy5jYXJkVG9Db21wYXJlLmNsYXNzTmFtZSA9PSBjdXJyZW50QnRuLmNsYXNzTmFtZSkge1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIHdpblByb3BlcnRpZXMudGltZW91dERvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgd2luUHJvcGVydGllcy5jYXJkVG9Db21wYXJlLmNsYXNzTGlzdC50b2dnbGUoJ3Zpc2libGUnKTtcbiAgICAgICAgICAgICAgICBjdXJyZW50QnRuLmNsYXNzTGlzdC50b2dnbGUoJ3Zpc2libGUnKTtcbiAgICAgICAgICAgICAgICB3aW5Qcm9wZXJ0aWVzLnRpbWVvdXREb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAvLyAgICAgd2luUHJvcGVydGllcy5jYXJkVG9Db21wYXJlID0gbnVsbDtcbiAgICAgICAgICAgIHdpblByb3BlcnRpZXMuY3VycmVudGx5RmxpcHBlZENhcmRzID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfSk7XG5cbiAgICB9XG59XG5cbi8qKlxuICogU2h1ZmZsZSBwb3NpdGlvbnMgb2Ygc2VudCBpbiBhcnJheS5cbiAqIEBwYXJhbSBhcnJheSBBcnJheSB0byBzaHVmZmxlXG4gKiBAcmV0dXJucyBhcnJheSBTaHVmZmVsZWQgYXJyYXlcbiAqL1xuZnVuY3Rpb24gc2h1ZmZsZShhcnJheSkge1xuICB2YXIgY3VycmVudEluZGV4ID0gYXJyYXkubGVuZ3RoLCB0ZW1wb3JhcnlWYWx1ZSwgcmFuZG9tSW5kZXg7XG5cbiAgLy8gV2hpbGUgdGhlcmUgcmVtYWluIGVsZW1lbnRzIHRvIHNodWZmbGUuLi5cbiAgd2hpbGUgKDAgIT09IGN1cnJlbnRJbmRleCkge1xuXG4gICAgLy8gUGljayBhIHJlbWFpbmluZyBlbGVtZW50Li4uXG4gICAgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjdXJyZW50SW5kZXgpO1xuICAgIGN1cnJlbnRJbmRleCAtPSAxO1xuXG4gICAgLy8gQW5kIHN3YXAgaXQgd2l0aCB0aGUgY3VycmVudCBlbGVtZW50LlxuICAgIHRlbXBvcmFyeVZhbHVlID0gYXJyYXlbY3VycmVudEluZGV4XTtcbiAgICBhcnJheVtjdXJyZW50SW5kZXhdID0gYXJyYXlbcmFuZG9tSW5kZXhdO1xuICAgIGFycmF5W3JhbmRvbUluZGV4XSA9IHRlbXBvcmFyeVZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vKipcbiAqIEFkZCBrZXlib2FyZCBmdW5jdGlvbmFsaXR5IHRvIHRoZSBnYW1lLiBHYW1lIHdpbGwgYmUgcGxheWFibGUgd2l0aCBhcnJvd3MuXG4gKiBAcGFyYW0gd2luIFdpbmRvdyB0byBhZGQgZnVuY3Rpb25hbGl0eVxuICovXG5mdW5jdGlvbiBrZXlib2FyZE9wdCh3aW4pIHtcbndpbi5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gIHZhciBmb2N1c2VkID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgdmFyIG5leHQ7XG5cbiAgaWYgKGV2ZW50LmtleUNvZGUgPT0gMzcpIHsgIC8vIGxlZnQgYXJyb3dcbiAgICB0cnkge1xuICAgICAgbmV4dCA9IGZvY3VzZWQucHJldmlvdXNFbGVtZW50U2libGluZztcbiAgICB9IGNhdGNoIChudWxsUG9pbnRlckV4Y2VwdGlvbikge31cbiAgfVxuXG4gIGVsc2UgaWYoZXZlbnQua2V5Q29kZSA9PSAzOCkgeyAgLy8gZG93biBhcnJvd1xuICAgIHRyeSB7XG4gICAgICBuZXh0ID0gZm9jdXNlZC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nLnByZXZpb3VzRWxlbWVudFNpYmxpbmcucHJldmlvdXNFbGVtZW50U2libGluZy5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xuICAgIH0gY2F0Y2ggKG51bGxQb2ludGVyRXhjZXB0aW9uKSB7fVxuICB9XG5cbiAgZWxzZSBpZihldmVudC5rZXlDb2RlID09IDM5KSB7ICAvLyByaWdodCBhcnJvd1xuICAgIHRyeSB7XG4gICAgICBuZXh0ID0gZm9jdXNlZC5uZXh0RWxlbWVudFNpYmxpbmdcbiAgICB9IGNhdGNoIChudWxsUG9pbnRlckV4Y2VwdGlvbikge31cbiAgfVxuXG4gIGVsc2UgaWYoZXZlbnQua2V5Q29kZSA9PSA0MCkgeyAgLy8gZG93biBhcnJvd1xuICAgIHRyeSB7XG4gICAgICBuZXh0ID0gZm9jdXNlZC5uZXh0RWxlbWVudFNpYmxpbmcubmV4dEVsZW1lbnRTaWJsaW5nLm5leHRFbGVtZW50U2libGluZy5uZXh0RWxlbWVudFNpYmxpbmc7XG4gICAgfSBjYXRjaCAobnVsbFBvaW50ZXJFeGNlcHRpb24pIHt9XG4gIH1cblxuICBpZihuZXh0ICE9IG51bGwpIHtcbiAgICBuZXh0LmZvY3VzKCk7XG4gIH1cbiAgfSk7XG5cbn1cblxuLyoqXG4gKiBBZGQgc2V0dGluZ3MgYmFyIHRvIHdpbmRvdy5cbiAqIEBwYXJhbSB3aW5Qcm9wZXJ0aWVzIFdpbmRvdyBhbmQgaXRzIHByb3BlcnRpZXNcbiAqL1xuZnVuY3Rpb24gY3JlYXRlU2V0dGluZ3NCYXIod2luUHJvcGVydGllcykge1xuXG4gIHZhciBzZXR0aW5nc0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBzZXR0aW5nc0Rpdi5jbGFzc05hbWUgPSAnc2V0dGluZ3MnO1xuXG4gIHZhciByZWxvYWRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgdmFyIHNlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuXG4gIHJlbG9hZEJ0bi50ZXh0Q29udGVudCA9ICdSZWxvYWQnO1xuXG4gIHZhciBvcHRpb24xID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gIHZhciBvcHRpb24yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gIHZhciBvcHRpb24zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG5cbiAgb3B0aW9uMS50ZXh0Q29udGVudCA9ICczIHggNCc7XG4gIG9wdGlvbjIudGV4dENvbnRlbnQgPSAnNCB4IDQnO1xuICBvcHRpb24zLnRleHRDb250ZW50ID0gJzQgeCA1JztcblxuICBzZWxlY3QuYXBwZW5kQ2hpbGQob3B0aW9uMSk7XG4gIHNlbGVjdC5hcHBlbmRDaGlsZChvcHRpb24yKTtcbiAgc2VsZWN0LmFwcGVuZENoaWxkKG9wdGlvbjMpO1xuXG4gIHNlbGVjdC5zZWxlY3RlZEluZGV4ID0gMTtcblxuICByZWxvYWRCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGN1cnJlbnRXaW4gPSB0aGlzLnBhcmVudE5vZGUucGFyZW50Tm9kZTtcbiAgICB2YXIgY2FyZHMgPSBjdXJyZW50V2luLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2NhcmQnKTtcblxuICAgIHZhciBpO1xuICAgIHZhciBsID0gY2FyZHMubGVuZ3RoO1xuICAgIGZvcihpPTA7IGk8bDsgaSsrKXtcbiAgICAgIGNhcmRzLml0ZW0oMCkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjYXJkcy5pdGVtKDApKTtcbiAgICB9XG5cbiAgICB3aW5Qcm9wZXJ0aWVzLmN1cnJlbnRseUZsaXBwZWRDYXJkcyA9IDA7XG4gICAgd2luUHJvcGVydGllcy50aW1lb3V0RG9uZSA9IHRydWU7XG4gICAgd2luUHJvcGVydGllcy5jYXJkVG9Db21wYXJlID0gJyc7XG5cbiAgICBjcmVhdGVDYXJkcyh3aW5Qcm9wZXJ0aWVzKTtcbiAgfSk7XG5cbiAgc2V0dGluZ3NEaXYuYXBwZW5kQ2hpbGQoc2VsZWN0KTtcbiAgc2V0dGluZ3NEaXYuYXBwZW5kQ2hpbGQocmVsb2FkQnRuKTtcbiAgd2luUHJvcGVydGllcy53aW4uYXBwZW5kQ2hpbGQoc2V0dGluZ3NEaXYpO1xuXG59XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENyZWF0ZWQgYnkgYWRhbWpvaGFuc3NvbiBvbiAyMDE2LTEwLTE5LlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGVWaWRlb1dpbmRvdzogY3JlYXRlVmlkZW9XaW5kb3dcbn07XG5cbnZhciB3aW5kb3dzID0gcmVxdWlyZSgnLi93aW5kb3dzJyk7XG52YXIgYXBwID0gcmVxdWlyZSgnLi9hcHAnKTtcblxudmFyIG1heFdpbmRvd3MgPSA1O1xudmFyIGN1cnJlbnRXaW5kb3dzID0gMDtcblxuLypcbiAgSURzIG9mIHRoZSB2aWRlb3MuXG4gKi9cbnZhciB2aWQxSUQgPSAndnpIcmpPTWZIUFknO1xudmFyIHZpZDJJRCA9ICcwbmxKdXdPMEdEcyc7XG52YXIgdmlkM0lEID0gJ3RFbnNxcFRoYUZnJztcbnZhciB2aWQ0SUQgPSAnZm1JX05kcnh5MTQnO1xudmFyIHZpZDVJRCA9ICdGdEVwcDlsa2Z4QSc7XG5cbnZhciBtYWluVmlkZW87XG5cbi8qKlxuICogQ3JlYXRlcyBhIHZpZGVvIFdpbmRvdy4gQ2FsbHMgV2luZG93cyBjbGFzcyB0byBjcmVhdGUgV2luZG93LCB0aGVuIGFwcGVuZHMgdmlkZW8gaW5mbyB0byBpdC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlVmlkZW9XaW5kb3coKSB7XG5cbiAgLy8gT25seSA1IHZpZGVvIHdpbmRvd3MgYXJlIGFsbG93ZWQgYXQgdGhlIHNhbWUgdGltZVxuICBpZihjdXJyZW50V2luZG93cyAhPSA1KSB7XG5cbiAgICBjdXJyZW50V2luZG93cysrO1xuXG4gICAgLy8gQ3JlYXRlcyBhIGJhc2ljIHdpbmRvd1xuICAgIHZhciB3aW4gPSB3aW5kb3dzLmNyZWF0ZVdpbmRvdygnQ2luZW1hdGljcycpO1xuICAgIHdpbi5jbGFzc0xpc3QuYWRkKCd2aWRlb1dpbmRvdycpO1xuXG4gICAgbWFpblZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG5cbiAgICB2YXIgcGxheWxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBwbGF5bGlzdC5jbGFzc05hbWUgPSAncGxheWxpc3QnO1xuXG4gICAgLy8gQ3JlYXRlcyBhbGwgdGhlIGJ1dHRvbnNcbiAgICB2YXIgdmlkMUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIHZhciB2aWQyQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgdmFyIHZpZDNCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICB2YXIgdmlkNEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIHZhciB2aWQ1QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG5cbiAgICB2aWQxQnRuLmNsYXNzTmFtZSA9ICd2aWQxQnRuJztcbiAgICB2aWQyQnRuLmNsYXNzTmFtZSA9ICd2aWQyQnRuJztcbiAgICB2aWQzQnRuLmNsYXNzTmFtZSA9ICd2aWQzQnRuJztcbiAgICB2aWQ0QnRuLmNsYXNzTmFtZSA9ICd2aWQ0QnRuJztcbiAgICB2aWQ1QnRuLmNsYXNzTmFtZSA9ICd2aWQ1QnRuJztcblxuICAgIC8vIEFwcGVuZHMgbWV0aG9kIHRvIGNoYW5nZSBtYWluIHZpZGVvIG9uIGJ1dHRvbi1jbGlja1xuICAgIHZpZDFCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY3VycmVudE1haW5WaWQgPSB0aGlzLnBhcmVudE5vZGUucHJldmlvdXNTaWJsaW5nO1xuICAgICAgY2hhbmdlTWFpblZpZGVvKHZpZDFJRCwgY3VycmVudE1haW5WaWQpO1xuICAgIH0pO1xuICAgIHZpZDJCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY3VycmVudE1haW5WaWQgPSB0aGlzLnBhcmVudE5vZGUucHJldmlvdXNTaWJsaW5nO1xuICAgICAgY2hhbmdlTWFpblZpZGVvKHZpZDJJRCwgY3VycmVudE1haW5WaWQpO1xuICAgIH0pO1xuICAgIHZpZDNCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY3VycmVudE1haW5WaWQgPSB0aGlzLnBhcmVudE5vZGUucHJldmlvdXNTaWJsaW5nO1xuICAgICAgY2hhbmdlTWFpblZpZGVvKHZpZDNJRCwgY3VycmVudE1haW5WaWQpO1xuICAgIH0pO1xuICAgIHZpZDRCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY3VycmVudE1haW5WaWQgPSB0aGlzLnBhcmVudE5vZGUucHJldmlvdXNTaWJsaW5nO1xuICAgICAgY2hhbmdlTWFpblZpZGVvKHZpZDRJRCwgY3VycmVudE1haW5WaWQpO1xuICAgIH0pO1xuICAgIHZpZDVCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY3VycmVudE1haW5WaWQgPSB0aGlzLnBhcmVudE5vZGUucHJldmlvdXNTaWJsaW5nO1xuICAgICAgY2hhbmdlTWFpblZpZGVvKHZpZDVJRCwgY3VycmVudE1haW5WaWQpO1xuICAgIH0pO1xuXG4gICAgLy8gQXBwZW5kcyBidXR0b25zIHRvIFwicGxheWxpc3RcIi1kaXZcbiAgICBwbGF5bGlzdC5hcHBlbmRDaGlsZCh2aWQxQnRuKTtcbiAgICBwbGF5bGlzdC5hcHBlbmRDaGlsZCh2aWQyQnRuKTtcbiAgICBwbGF5bGlzdC5hcHBlbmRDaGlsZCh2aWQzQnRuKTtcbiAgICBwbGF5bGlzdC5hcHBlbmRDaGlsZCh2aWQ0QnRuKTtcbiAgICBwbGF5bGlzdC5hcHBlbmRDaGlsZCh2aWQ1QnRuKTtcblxuICAgIHdpbi5hcHBlbmRDaGlsZChtYWluVmlkZW8pO1xuXG4gICAgd2luLmFwcGVuZENoaWxkKHBsYXlsaXN0KTtcblxuICAgIC8vIFNldCBtYWluIHZpZGVvIHRvIHZpZDFCdG5zIHZpZGVvXG4gICAgY2hhbmdlTWFpblZpZGVvKHZpZDFJRCwgdmlkMUJ0bi5wYXJlbnROb2RlLnByZXZpb3VzU2libGluZyk7XG5cbiAgICAvKlxuICAgICAgV2hlbiB3aW5kb3dzIHhCdG4gaXMgcHJlc3NlZCwgY3VycmVudFdpbmRvd3MgY291bnRlciBpcyByZWR1Y2VkIGJ5IDFcbiAgICAgIChhbmQgV2luZG93IGlzIGNsb3NlZCwgc2VlIFdpbmRvd3MgQ2xhc3MpLlxuICAgICAqL1xuICAgIHdpbi5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCd4QnRuJykuaXRlbSgwKS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjdXJyZW50V2luZG93cy0tO1xuICAgIH0pO1xuXG4gIH1cbiAgLy8gSWYgbW9yZSB0aGFuIDUgd2luZG93cyBhcmUgb3BlbiwgY2FsbCBhcHAgbWV0aG9kIHRvIGRpc3BsYXkgaW5mbyBtZXNzYWdlLlxuICBlbHNlIHtcbiAgICBhcHAuaW5mb01lc3NhZ2UoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZGVvQnRuJyksICdZb3UgY2FuIG9ubHkgaGF2ZSA1IHZpZGVvIHdpbmRvd3Mgb3BlbiBhdCB0aGUgc2FtZSB0aW1lLicpXG4gIH1cbn1cbi8qKlxuICogQ2hhbmdlIHRoZSBtYWluIHZpZGVvIG9mIHRoZSB3aW5kb3dcbiAqIEBwYXJhbSBpZCBJRCBvZiB0aGUgdmlkZW9cbiAqIEBwYXJhbSBjdXJyZW50TWFpblZpZCBDdXJyZW50IG1haW4gdmlkZW9cbiAqL1xuZnVuY3Rpb24gY2hhbmdlTWFpblZpZGVvKGlkLCBjdXJyZW50TWFpblZpZCkge1xuICBjdXJyZW50TWFpblZpZC5zZXRBdHRyaWJ1dGUoJ3NyYycsICdodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nICsgaWQpO1xuICBjdXJyZW50TWFpblZpZC5zZXRBdHRyaWJ1dGUoJ2FsbG93ZnVsbHNjcmVlbicsICcnKTtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENyZWF0ZWQgYnkgYWRhbWpvaGFuc3NvbiBvbiAyMDE2LTEwLTE3LlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGVXaW5kb3c6IGNyZWF0ZVdpbmRvd1xufTtcblxudmFyIHdpbmRvd1NlY3Rpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2luZG93U2VjdGlvbicpO1xuXG4vLyBTdG9yZXMgeCAmIHkgY29vcmRpbmF0ZXMgb2YgdGhlIG1vdXNlIHBvaW50ZXIuXG52YXIgeF9wb3MgPSAwLCB5X3BvcyA9IDA7XG5cbi8vIFotdmFsdWUgb2YgZm9jdXNlZCB3aW5kb3cuXG52YXIgY3VycmVudFogPSAwO1xuXG52YXIgY3VycmVudFdpbiA9IG51bGw7XG5cbnZhciB4X2VsZW07XG52YXIgeV9lbGVtO1xudmFyIHN0YXJ0WTtcblxuLyoqXG4gKiBNZXRob2QgdG8gY3JlYXRlIGEgc2ltcGxlIGVtcHR5IHdpbmRvd1xuICogQHBhcmFtIHR5cGUgVHlwZSBvZiB3aW5kb3csIHVzZWQgZm9yIGRpc3BsYXkgYXQgdGhlIHRvcCBvZiB0aGUgd2luZG93LlxuICogQHJldHVybnMge0VsZW1lbnR9IFdpbmRvdyBjcmVhdGVkXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVdpbmRvdyh0eXBlKSB7XG5cbiAgdmFyIHdpbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcblxuICAvLyBXaW5kb3cgaXMgY3JlYXRlZCBhdCB4X3BvcyBhbmQgeV9wb3NcbiAgd2luLnN0eWxlLmxlZnQgPSB4X3BvcyArICdweCc7XG4gIHdpbi5zdHlsZS50b3AgPSB5X3BvcyArICdweCc7XG5cbiAgLy8gSWYgeF9wb3Mgb3IgeV9wb3MgYXJlIGxhcmdlciB0aGFuIHRoZSBzaXplIG9mIHdpbmRvdywgaXQgaXMgcmVzZXQuXG4gIGlmKHhfcG9zID49ICh3aW5kb3cuaW5uZXJXaWR0aCAtIDIwMCkpIHtcbiAgICB4X3BvcyA9IDU7XG4gIH1cbiAgaWYoeV9wb3MgPj0gKHdpbmRvdy5pbm5lckhlaWdodCAtIDIwMCkpIHtcbiAgICB5X3BvcyA9IDU7XG4gIH1cblxuICAvKlxuICAgIENyZWF0ZXMgZWxlbWVudHMgZm9yIHRoZSB3aW5kb3cgYW5kIGFkZHMgaW5mbyB0byB0aGVtLlxuICAgKi9cbiAgdmFyIGRyYWdTZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICB2YXIgeEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuXG4gIGRyYWdTZWN0aW9uLnRleHRDb250ZW50ID0gdHlwZTtcbiAgeEJ0bi50ZXh0Q29udGVudCA9ICdYJztcblxuICB3aW4uY2xhc3NOYW1lID0gJ3dpbmRvdyc7XG4gIGRyYWdTZWN0aW9uLmNsYXNzTmFtZSA9ICdkcmFnU2VjdGlvbic7XG4gIHhCdG4uY2xhc3NOYW1lID0gJ3hCdG4nO1xuXG4gIC8qXG4gICAgV2hlbiBhIHdpbmRvdyBpcyBjbGlja2VkIChtb3VzZWRvd24pLCBpdCBpcyBwdXQgb24gdG9wIGluIHRoZSBET00gKGhpZ2hlc3QgWi1pbmRleCkuXG4gICAqL1xuICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdHlsZS56SW5kZXggPSBjdXJyZW50WisrO1xuICB9KTtcblxuICAvKlxuICAgIFdoZW4gdGhlIGRyYWdzZWN0aW9uIGlzIFwibW91c2Vkb3duOmVkXCIsIGl0cyB3aW5kb3cgaXMgYWJsZSB0byBiZSBtb3ZlZCB1c2luZyB3aW5Nb2UuXG4gICAqL1xuICBkcmFnU2VjdGlvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuXG4gICAgY3VycmVudFdpbiA9IHRoaXM7XG5cbiAgICBjdXJyZW50V2luLnN0YXJ0WSA9IGN1cnJlbnRXaW4uY2xpZW50WTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgd2luTW92ZSwgdHJ1ZSk7XG5cbiAgICBjdXJyZW50V2luLnhfZWxlbSA9IGV2ZW50LmNsaWVudFg7XG4gICAgY3VycmVudFdpbi55X2VsZW0gPSBldmVudC5jbGllbnRZO1xuICB9KTtcblxuICAvKlxuICAgIFdoZW4gdGhlIG1vdXNlIGlzIHJlbGVhc2VkIGFueXdoZXJlLCB3aW5Nb3ZlIGlzIHJlbW92ZWQgYXMgYSBsaXN0ZW5lciwgYW5kIGN1cnJlbnRXaW4gPSBudWxsLlxuICAgKi9cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICAgIGlmKGN1cnJlbnRXaW4gIT0gbnVsbCkge1xuICAgICAgeF9wb3MgPSBjdXJyZW50V2luLnhfZWxlbTtcbiAgICAgIHlfcG9zID0gY3VycmVudFdpbi55X2VsZW07XG4gICAgfVxuXG4gICAgY3VycmVudFdpbiA9IG51bGw7XG4gICAgZHJhZ1NlY3Rpb24ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgd2luTW92ZSwgdHJ1ZSk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBNZXRob2QgdG8gbW92ZSBXaW5kb3cgZSBhY2NvcmRpbmcgdG8gdGhlIG1vdXNlLlxuICAgKiBAcGFyYW0gZSBXaW5kb3cgdG8gbW92ZVxuICAgKi9cbiAgZnVuY3Rpb24gd2luTW92ZShlKSB7XG5cbiAgICAvKlxuICAgICAgR2V0IGN1cnJlbnQgcG9zaXRpb24gb2YgbW91c2UuXG4gICAgICovXG4gICAgeF9wb3MgPSBkb2N1bWVudC5hbGwgPyB3aW5kb3cuZXZlbnQuY2xpZW50WCA6IGUucGFnZVg7XG4gICAgeV9wb3MgPSBkb2N1bWVudC5hbGwgPyB3aW5kb3cuZXZlbnQuY2xpZW50WSA6IGUucGFnZVk7XG5cbiAgICBpZihjdXJyZW50V2luICE9IG51bGwpIHtcblxuICAgICAgdmFyIG5ld1hwb3MgPSAoeF9wb3MgLSAxNTApO1xuICAgICAgdmFyIG5ld1lwb3MgPSAoeV9wb3MgLSAyMCk7XG5cbiAgICAgIC8qXG4gICAgICAgIFdpbmRvdyBpcyBub3QgYWJsZSB0byBtb3ZlIGFjcm9zcyBsZWZ0IGJvYXJkZXIgb3IgdG9wIG9mIHBhZ2UuXG4gICAgICAgKi9cbiAgICAgIGlmKG5ld1hwb3MgPD0gMCkge1xuICAgICAgICBuZXdYcG9zID0gMTtcbiAgICAgIH1cbiAgICAgIGlmKG5ld1lwb3MgPD0gMCkge1xuICAgICAgICBuZXdZcG9zID0gMTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hhbmdlcyB0aGUgcG9zaXRpb24gb2YgdGhlIHdpbmRvdy5cbiAgICAgIGN1cnJlbnRXaW4ucGFyZW50Tm9kZS5zdHlsZS5sZWZ0ID0gbmV3WHBvcyArICdweCc7XG4gICAgICBjdXJyZW50V2luLnBhcmVudE5vZGUuc3R5bGUudG9wID0gbmV3WXBvcyArICdweCc7XG5cbiAgICB9XG4gIH1cblxuICAvKlxuICAgIFJlbW92ZXMgd2luZG93IHdoZW4gdGhlIHhCdG4gb2YgaXQgaXMgXCJtb3VzZWRvd246ZWRcIi5cbiAgICovXG4gIHhCdG4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKCkge1xuICAgIGN1cnJlbnRXaW4gPSBudWxsO1xuICAgIHhCdG4ucGFyZW50Tm9kZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQod2luKTtcbiAgfSk7XG5cbiAgLy8gQWRkcyBvZmZzZXQgZm9yIHdoZW4gbmV4dCB3aW5kb3cgaXMgY3JlYXRlZC5cbiAgeF9wb3MgKz0gMTA7XG4gIHlfcG9zICs9IDEwO1xuXG4gIC8vIEN1cnJlbnR3aW5kb3cgaXMgY3JlYXRlZCBpbiB0aGUgdG9wIG9mIHRoZSBET00gKGhpZ2hlc3QgWi1pbmRleCkuXG4gIHdpbi5zdHlsZS56SW5kZXggPSBjdXJyZW50WisrO1xuXG4gIGRyYWdTZWN0aW9uLmFwcGVuZENoaWxkKHhCdG4pO1xuICB3aW4uYXBwZW5kQ2hpbGQoZHJhZ1NlY3Rpb24pO1xuICB3aW5kb3dTZWN0aW9uLmFwcGVuZENoaWxkKHdpbik7XG5cbiAgcmV0dXJuIHdpbjtcbn1cblxuIl19
