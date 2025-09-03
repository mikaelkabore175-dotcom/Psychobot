// commands/extract.js
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const log = require('../logger')(module);

module.exports = {
    name: 'extract',
    description: 'Extrait et sauvegarde un média (image, vidéo ou voix), y compris view once.',
    adminOnly: false,
    run: async ({ sock, msg, replyWithTag }) => {
        try {
            // --- Crée dossier temporaire ---
            const tempDir = path.join(__dirname, "../temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const remoteJid = msg.key.remoteJid;
            const reactorJid = msg.key.participant || remoteJid;
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;

            // --- Gérer view once ---
            const mediaMsg = quoted.viewOnceMessage ? quoted.viewOnceMessage.message : quoted;

            // --- Détecter type média ---
            const mediaType = mediaMsg.imageMessage ? 'image' :
                              mediaMsg.videoMessage ? 'video' :
                              mediaMsg.audioMessage ? 'audio' : null;

            if (!mediaType) {
                return replyWithTag(sock, remoteJid, msg, "❌ Veuillez réagir à une image, vidéo ou note vocale (view once inclus).");
            }

            const ext = mediaType === 'image' ? 'jpg' :
                        mediaType === 'video' ? 'mp4' : 'ogg';
            const tempPath = path.join(tempDir, `media_${Date.now()}.${ext}`);

            await replyWithTag(sock, remoteJid, msg, '⏳ Téléchargement en cours...');

            // --- Télécharger le média ---
            let buffer = Buffer.from([]);
            const stream = await downloadContentFromMessage(
                mediaMsg.imageMessage || mediaMsg.videoMessage || mediaMsg.audioMessage,
                mediaType
            );
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            fs.writeFileSync(tempPath, buffer);
            log(`[EXTRACT] Média téléchargé: ${tempPath} (${buffer.length} bytes)`);

            // --- Préparer l'objet d'envoi ---
            let sendObj;
            if (mediaType === 'image') sendObj = { image: { url: tempPath }, caption: "📸 Média extrait" };
            else if (mediaType === 'video') sendObj = { video: { url: tempPath }, caption: "🎬 Média extrait" };
            else sendObj = { audio: { url: tempPath }, mimetype: 'audio/ogg' };

            // --- Envoi directement dans le chat privé du réacteur ---
            await sock.sendMessage(reactorJid, sendObj);
            log(`[EXTRACT] Média envoyé à ${reactorJid} ✅`);

        } catch (err) {
            console.error('[EXTRACT] Erreur:', err);
            await replyWithTag(sock, msg.key.remoteJid, msg, "❌ Impossible de récupérer le média.");
        } finally {
            // --- Nettoyage ---
            try {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                log('[EXTRACT] Nettoyage terminé.');
            } catch {}
        }
    }
};