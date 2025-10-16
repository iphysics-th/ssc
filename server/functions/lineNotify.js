const axios = require('axios')

exports.notifyLine = async(message) => {
    try {
        const response = await axios({
            method: 'POST',
            url: 'https://notify-api.line.me/api/notify',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + process.env.LINE_NOTIFY_TOKEN, // Use environment variable
            },
            data: 'message=' + message
        });

        console.log('LINE notification sent:', response.data);
    } catch (err) {
        console.log('Error sending LINE notification:', err);
    }
}
