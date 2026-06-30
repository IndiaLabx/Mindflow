let interval: any;

self.onmessage = (e) => {
    if (e.data === 'START') {
        if (interval) clearInterval(interval);
        interval = setInterval(() => {
            self.postMessage('TICK');
        }, 1000);
    } else if (e.data === 'STOP') {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    }
};
