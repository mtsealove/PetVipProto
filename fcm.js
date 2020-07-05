var FCM = require('fcm-node');
var serverKey = 'AAAABtd_Eio:APA91bFuq5scITNwMNkv_25XkIGUf0O_Rnhxd5Xh6Ft96k5-qd5PycZGw02rs0fXMfuC9CJdTfGEhT5-XKEpx2kRI5qOU6FcDQkOg6Rru4ropTtIWcfYuTdhZz6tIgZlU_nS7-xN7ACs'
var fcm = new FCM(serverKey)

exports.sendFcm = (token = String, msg = String) => {
    var message = {
        to: token,
        collapse_key: 'your_collapse_key',

        notification: {
            title: 'Title of your push notification',
            body: 'Body of your push notification'
        },

        data: {
            body: msg,
        }
    }
    fcm.send(message, function (err, response) {
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    })
}