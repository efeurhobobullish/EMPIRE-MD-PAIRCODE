const express = require('express');
const fs = require('fs');
const { exec } = require("child_process");
const QRCode = require('qrcode');
let router = express.Router()
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    async function PrabathQR() {
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);
        try {
            let PrabathQRWeb = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
            });

            PrabathQRWeb.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr) {
                    const qrImage = await QRCode.toDataURL(qr);
                    if (!res.headersSent) {
                        res.send({ qr: qrImage });
                    }
                }

                if (connection === "open") {
                    try {
                        await delay(10000);
                        const sessionPrabath = fs.readFileSync('./session/creds.json');
                        const auth_path = './session/';
                        const user_jid = jidNormalizedUser(PrabathQRWeb.user.id);

                        function randomMegaId(length = 6, numberLength = 4) {
                            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                            let result = '';
                            for (let i = 0; i < length; i++) {
                                result += characters.charAt(Math.floor(Math.random() * characters.length));
                            }
                            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                            return `${result}${number}`;
                        }

                        const mega_url = await upload(fs.createReadStream(auth_path + 'creds.json'), `${randomMegaId()}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        const sid = string_session;

                        const dt = await PrabathQRWeb.sendMessage(user_jid, {
                            text: sid
                        });

                        await delay(5000);
                        await PrabathQRWeb.sendMessage(user_jid, {
                            text: `> CONNECTED SUCCESSFULLY ✅  
╭────「 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 」────◆  
│ ∘ ʀᴇᴘᴏ:  
│ ∘ tinyurl.com/Empire-Tech  
│──────────────────────
│ ∘ Gʀᴏᴜᴘ:  
│ ∘ tinyurl.com/EMPIRE-MD-GROUP  
│──────────────────────
│ ∘ CHANNEL:  
│ ∘ tinyurl.com/EMPIRE-MD-CHANNEL  
│──────────────────────
│ ∘ Yᴏᴜᴛᴜʙᴇ:  
│ ∘ youtube.com/only_one_empire  
│──────────────────────
│ ∘ 𝙴𝙼𝙿𝙸𝚁𝙴-𝙼𝙳 𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙴𝚖𝚙𝚒𝚛𝚎 𝚃𝚎𝚌𝚑  
╰──────────────────────`
                        });

                    } catch (e) {
                        exec('pm2 restart prabath');
                    }

                    await delay(100);
                    return await removeFile('./session');
                    process.exit(0);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    PrabathQR();
                }
            });

            PrabathQRWeb.ev.on('creds.update', saveCreds);
        } catch (err) {
            exec('pm2 restart prabath-md');
            PrabathQR();
            await removeFile('./session');
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }
    return await PrabathQR();
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    exec('pm2 restart prabath');
});

module.exports = router;
