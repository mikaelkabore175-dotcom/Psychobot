module.exports = {
    name: "ping",
    description: "Répond pong !",
    run: async ({ sock, msg }) => {
        await sock.sendMessage(msg.key.remoteJid, { text: "pong !" });
    }
};