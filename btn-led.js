/**
 * 定義樹莓派 GPIO 腳位
 */
var Gpio = require('onoff').Gpio;
var LED1 = new Gpio(4, 'out');
var LED2 = new Gpio(19, 'out');
var pushBtn1 = new Gpio(17, 'in', 'both');
var pushBtn2 = new Gpio(26, 'in', 'both');

/**
 * Web Section
 */
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
server.listen(3000, _ => {
    console.log("server is running on port 3000!");
});

var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    var ref = database.ref('IoT/LED')
    ref.once('value', snap => {
        var data = snap.val();
        res.render('index', data);
    });
});

app.post('/:id', (req, res) => {
    const id = req.params.id;
    toggleLED(parseInt(id));
    res.sendStatus(200);
});

/**
 * Socket.io & listen firebase child change event
 */
var database = require('./firebase_config');
var ref1 = database.ref('IoT/LED').child('LED1');
var ref2 = database.ref('IoT/LED').child('LED2');

io.on('connection', socket => {
    console.log('A user connected!');

    ref1.on('value', snap => {
        let data = snap.val();
        LED1.writeSync(data);
        socket.emit('LED1_changed', data);
    });

    ref2.on('value', snap => {
        let data = snap.val();
        LED2.writeSync(data);
        socket.emit('LED2_changed', data);
    });

    socket.on('disconnect', _ => {
        console.log('A user disconnected!')
    });
});

/**
 * 用來跟firebase溝通LED的開關
 * @param {string} LED_code - LED的代號
 * @param {number} status - LED的狀態，1代表開啟，0代表關閉
 */
function RemoteToggleLEDdb(LED_code, status) {
    if (LED_code == 'reset') {
        const updates = {};
        updates[`IoT/LED/LED1`] = status;
        updates[`IoT/LED/LED2`] = status;
        database.ref().update(updates);
        return;
    }
    const updates = {};
    updates[`IoT/LED/${LED_code}`] = status;
    database.ref().update(updates);
};

/**
 * 會觸發一次該LED的開關
 * @param {number} LED_code - LED 的代號
 */
function toggleLED(LED_code) {
    switch (LED_code) {
        case 1:
            if (LED1.readSync() == 0) {
                LED1.writeSync(1);
                RemoteToggleLEDdb('LED1', 1)
            } else {
                LED1.writeSync(0);
                RemoteToggleLEDdb('LED1', 0)
            }
            console.log('you pressed the btn 1!')
            break;
        case 2:
            if (LED2.readSync() == 0) {
                LED2.writeSync(1);
                RemoteToggleLEDdb('LED2', 1)
            } else {
                LED2.writeSync(0);
                RemoteToggleLEDdb('LED2', 0)
            }
            console.log('you pressed the btn 2!')
            break;
        default:
            console.log('Please check your input value.')
    }
};


/**
 * 監測按鈕1有沒有被按，如果有則觸發一次開關
 */
pushBtn1.watch(function (err, value) {
    if (value == 1) {
        toggleLED(1)
    }
});

/**
 * 監測按鈕2有沒有被按，如果有則觸發一次開關
 */
pushBtn2.watch(function (err, value) {
    if (value == 1) {
        toggleLED(2)
    }
});

/**
 * 結束時要重置 LED、按鈕狀態
 */
function unexportOnClose() {
    RemoteToggleLEDdb('reset', 0);
    LED1.writeSync(0);
    LED1.unexport();
    pushBtn1.unexport();
    LED2.writeSync(0);
    LED2.unexport();
    pushBtn2.unexport();
    process.exit(0);// https://github.com/fivdi/onoff/issues/110
};

/**
 * 當程式按 Ctrl + C 終止時，會執行 unexportOnClose 函數
 */
process.on('SIGINT', unexportOnClose);