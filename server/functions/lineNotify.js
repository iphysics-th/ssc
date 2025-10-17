exports.notifyLine = async (message) => {
    try {
        const response = await fetch('https://notify-api.line.me/api/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${process.env.LINE_NOTIFY_TOKEN}`,
            },
            body: new URLSearchParams({ message }).toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LINE notify error: ${response.status} ${errorText}`);
        }

        const data = await response.json().catch(() => ({}));
        console.log('LINE notification sent:', data);
    } catch (err) {
        console.log('Error sending LINE notification:', err);
    }
};
