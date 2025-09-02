// index.js
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require("qrcode-terminal");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const db = require('./database');
const startTime = new Date();

const AUTH_FOLDER = path.join(__dirname, "auth_info");
const PREFIX = "!";
const BOT_NAME = "PSYCHO BOT";
const BOT_TAG = `*${BOT_NAME}* 👨🏻‍💻`;
const TARGET_NUMBER = "237696814391"; // Numéro cible pour MP3/mentions

// --- Loader de commandes ---
const commands = new Map();
const commandFolder = path.join(__dirname, 'commands');
if (!fs.existsSync(commandFolder)) fs.mkdirSync(commandFolder);

fs.readdirSync(commandFolder).filter(f => f.endsWith('.js')).forEach(file => {
    try {
        const command = require(path.join(commandFolder, file));
        commands.set(command.name, command);
        console.log(`[CommandLoader] Commande chargée : ${command.name}`);
    } catch (err) {
        console.error(`[CommandLoader] Erreur de chargement de ${file}:`, err);
    }
});

// --- Fonctions utilitaires ---
function replyWithTag(sock, jid, quoted, text) {
    return sock.sendMessage(jid, { text: `${BOT_TAG}\n\n${text}` }, { quoted });
}

function getMessageText(msg) {
    const m = msg.message;
    if (!m) return "";
    return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || "";
}

// --- Chargement du MP3 principal ---
let mp3Buffer = null;
try {
    mp3Buffer = fs.readFileSync(path.join(__dirname, 'fichier.mp3'));
    console.log('[MP3] fichier.mp3 chargé.');
} catch (err) {
    console.error('[MP3] Impossible de lire fichier.mp3:', err);
}

// --- Démarrage du bot ---
async function startBot() {
    console.log("Démarrage du bot WhatsApp...");
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
    });

    sock.ev.on("connection.update", update => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("------------------------------------------------");
            qrcode.generate(qr, { small: true });
            console.log("[QR] Scannez ce code avec WhatsApp.");
            console.log("------------------------------------------------");
        }
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
            else console.log("Déconnecté, supprime auth_info pour reconnecter manuellement.");
        } else if (connection === "open") console.log("✅ Bot connecté !");
    });

    sock.ev.on("creds.update", saveCreds);

    // --- Gestion des messages ---
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify" || !messages[0]?.message) return;
        const msg = messages[0];
        const remoteJid = msg.key.remoteJid;
        const senderId = msg.key.fromMe
            ? sock.user.id.split(':')[0] + '@s.whatsapp.net'
            : (remoteJid.endsWith('@g.us') ? msg.key.participant : remoteJid);

        await db.getOrRegisterUser(senderId, msg.pushName || "Unknown");

        const text = getMessageText(msg);
        const isGroup = remoteJid.endsWith('@g.us');

        // --- Détection mention ou numéro ---
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.some(jid => jid.split('@')[0] === TARGET_NUMBER);
        const containsNumber = text.includes(TARGET_NUMBER);
        const sendMp3 = mentioned || containsNumber;

        if (isGroup && mp3Buffer && sendMp3) {
            try {
                await sock.sendMessage(remoteJid, { audio: mp3Buffer, mimetype: 'audio/mpeg', fileName: 'fichier.mp3' }, { quoted: msg });
                console.log(`[MP3] fichier.mp3 envoyé à ${senderId}`);
            } catch (err) {
                console.error('[MP3] Erreur lors de l\'envoi:', err);
            }
        }

        // --- Commande !downloadbot intégrée ---
        if (text.toLowerCase() === `${PREFIX}downloadbot`) {
            const mp3Files = ['fichier1.mp3', 'fichier2.mp3', 'fichier3.mp3'];
            for (const file of mp3Files) {
                const mp3Path = path.join(__dirname, file);
                if (!fs.existsSync(mp3Path)) {
                    await replyWithTag(sock, remoteJid, msg, `❌ Le fichier ${file} est introuvable.`);
                    continue;
                }

                try {
                    const mp3BufferVoice = fs.readFileSync(mp3Path);
                    await sock.sendMessage(remoteJid, {
                        audio: mp3BufferVoice,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true,
                        fileName: file.replace('.mp3', '.ogg')
                    }, { quoted: msg });
                    console.log(`[Voice] ${file} envoyé à ${remoteJid}`);
                } catch (err) {
                    console.error(`[Voice] Erreur lors de l'envoi de ${file}:`, err);
                    await replyWithTag(sock, remoteJid, msg, `❌ Une erreur est survenue lors de l'envoi de ${file}.`);
                }
            }
        }

        // --- Gestion des autres commandes ---
        if (!text.startsWith(PREFIX)) return;

        const args = text.slice(PREFIX.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName || !commands.has(commandName)) return;

        const command = commands.get(commandName);

        try {
            if (command.adminOnly && isGroup) {
                const groupMetadata = await sock.groupMetadata(remoteJid);
                const senderIsAdmin = groupMetadata.participants.some(
                    p => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
                );
                if (!senderIsAdmin) return replyWithTag(sock, remoteJid, msg, "⛔ Seuls les admins peuvent utiliser cette commande.");
            }

            await command.run({ sock, msg, args, replyWithTag, commands, db });
            await db.incrementCommandCount(senderId);

        } catch (err) {
            console.error(`[ERREUR] Commande "${commandName}" :`, err);
            try { await replyWithTag(sock, remoteJid, msg, "❌ Une erreur est survenue."); } catch {}
        }
    });

    // --- Exécuter extract sur certaines réactions (view-once inclus) ---
    sock.ev.on('messages.reaction', async ({ reactions }) => {
        try {
            if (!reactions || reactions.length === 0) return;

            const validReactions = ['❤️', '😂', '😍', '👍'];

            for (const reaction of reactions) {
                if (!validReactions.includes(reaction.text)) continue;

                const reactorJid = reaction.key.participant || reaction.key.remoteJid;
                const remoteJid = reaction.key.remoteJid;

                const quotedMessage = reaction.message?.contextInfo?.quotedMessage;
                const msgToExtract = quotedMessage ? { ...reaction, message: quotedMessage } : reaction;

                const extractCommand = commands.get('extract');
                if (extractCommand) {
                    await extractCommand.run({
                        sock,
                        msg: msgToExtract,
                        replyWithTag: async (s, jid, _, text) => {
                            await s.sendMessage(reactorJid, { text });
                        }
                    });
                    console.log(`[REACT] Média extrait pour ${reactorJid} (réaction : ${reaction.text})`);
                }
            }
        } catch (err) {
            console.error('[REACT] Erreur lors du traitement d’une réaction :', err.message);
        }
    });
}

// --- Serveur web ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send({ status: "online", botName: BOT_NAME, uptime: (new Date() - startTime)/1000 }));
app.listen(PORT, () => { console.log(`[WebServer] Démarré sur port ${PORT}`); startBot(); });