const express = require('express');
const app = express();
__path = process.cwd()
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
const qr = require('./qr')
const code = require('./pair');
require('events').EventEmitter.defaultMaxListeners = 1000;
app.use('/qr', qr);
app.use('/code', code);
app.use('/pair',async (req, res, next) => {
res.sendFile(__path + '/pair.html')
})
app.use('/qr-page',async (req, res, next) => {
res.sendFile(__path + '/qr.html')
})
app.use('/',async (req, res, next) => {
res.sendFile(__path + '/main.html')
})
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:` + PORT)
})

module.exports = app
