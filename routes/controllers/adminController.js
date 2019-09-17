

const login = (req, res, next) => {
    res.render('login');
}

const home = (req, res, next) => {
    res.render('index', { focus: 0 });
}

module.exports = {
    login,
    home
}