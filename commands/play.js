
// commands/play.js
const fs = require('fs');
const path = require('path');
const log = require('../logger')(module);
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');
const fetch = require('node-fetch');

// 🔹 Liste de mots interdits
const explicitWords = [
    'porn','porno','xxx','sex','sexe','18+','nsfw','erotic','erotique','nude',
    'bite','zizi','chatte','mbombo'
];

function isExplicit(text) {
    return explicitWords.some(word => text.toLowerCase().includes(word));
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

module.exports = {
    name: 'play',
    description: "Recherche et envoie une chanson depuis YouTube.",
    adminOnly: false,
    run: async ({ sock, msg, args, replyWithTag }) => {
        const remoteJid = msg.key.remoteJid;
        const query = args.join(" ");

        if (!query) return replyWithTag(sock, remoteJid, msg, "❌ Veuillez entrer le nom d'une chanson.");
        if (isExplicit(query)) return replyWithTag(sock, remoteJid, msg, "❌ Contenu explicite interdit.");

        // Dossier temporaire
        const tempDir = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        let tempPath = '';

        try {
            await replyWithTag(sock, remoteJid, msg, `🔎 Recherche de "${query}"...`);

            // --- Recherche sur YouTube ---
            const search = await yts(query);
            const videoInfo = search.videos[0];
            if (!videoInfo) return replyWithTag(sock, remoteJid, msg, "❌ Aucun résultat trouvé.");
            if (isExplicit(videoInfo.title)) return replyWithTag(sock, remoteJid, msg, "❌ Contenu explicite interdit.");

            // --- Infos chanson ---
            const formattedDuration = formatDuration(videoInfo.seconds);
            const caption = `
🎵 *${videoInfo.title}*
👤 ${videoInfo.author.name}
⏱️ ${formattedDuration}
👁️ ${videoInfo.views.toLocaleString()} vues
`;

            await replyWithTag(sock, remoteJid, msg, `⏳ Téléchargement de *${videoInfo.title}*...`);

            // --- Téléchargement audio via ddownr ---
            const result = await ddownr.download(videoInfo.url, 'mp3');
            const downloadLink = result.downloadUrl;

            const cleanTitle = videoInfo.title.replace(/[^\w\s]/gi, '').substring(0, 30);
            tempPath = path.join(tempDir, `${cleanTitle}_${Date.now()}.mp3`);

            const response = await fetch(downloadLink);
            const arrayBuffer = await response.arrayBuffer();
            fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

            // --- Envoi audio ---
            await sock.sendMessage(remoteJid, {
                audio: { url: tempPath },
                mimetype: 'audio/mpeg',
                fileName: `${cleanTitle}.mp3`,
                caption
            }, { quoted: msg });

            log(`[PLAY] Audio envoyé : ${videoInfo.title}`);
        } catch (err) {
            log(`[PLAY] Erreur : ${err.message}`);
            await replyWithTag(sock, remoteJid, msg, "❌ Une erreur est survenue lors du téléchargement.");
        } finally {
            if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }
};