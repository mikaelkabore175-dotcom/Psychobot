module.exports = {
    name: "audio",
    run: async ({ sock, msg }) => {
        const from = msg.key.remoteJid;
        await sock.sendMessage(from, {
            audio: { url: "./fichier.mp3" }, // ton fichier
            mimetype: "audio/mpeg",         // correct pour MP3
            ptt: true                        // envoyé comme note vocale
        });
    }
};