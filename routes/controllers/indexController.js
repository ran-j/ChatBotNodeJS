
const chatView = (req, res, next) => {
    res.render('chat', { title: 'Tensorflow JS' });
}

module.exports = {
    chatView,
}