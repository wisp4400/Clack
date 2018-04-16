function generateMsgId(userID) {
    return (Date.now() << 32) | parseInt(userID);
}
