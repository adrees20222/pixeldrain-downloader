const https = require('https');

function checkCdn(id) {
    const url = `https://cdn.pixeldrain.eu.cc/${id}?download`;
    console.log("Checking CDN:", url);
    https.get(url, (res) => {
        console.log("Status:", res.statusCode);
        console.log("Headers:", res.headers);
        if (res.statusCode === 302) {
            console.log("Redirecting to:", res.headers.location);
            https.get(res.headers.location, (res2) => {
                console.log("Status2:", res2.statusCode);
                console.log("Headers2:", res2.headers);
                res2.on('data', () => {});
            });
        }
        res.on('data', () => {});
    }).on('error', (e) => {
        console.error(e);
    });
}

checkCdn('randomId1234');
