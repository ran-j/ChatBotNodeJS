
const attendence = (req, res, next) => {
    res.render('chat', { title: 'Tensorflow JS' });
}

const buildAgent = async (req, res, next) => {
    if (Agent.isAgentBuilding) return res.status(403).end('Agent are building');
    try {
        await Agent.BuildAgent(true)
        res.end("done")
    } catch (error) {
        console.error(error)
        res.status(500).end('Erro on build agent');
    }
}

const ask = async (req, res, next) => {
    try {
        let resp = await Agent.response(req.body.say, req.body.uID, true)
        res.end(resp)
    } catch (error) {
        res.end("Ops, internal error X(")
    }
}

module.exports = {
    attendence,
    buildAgent,
    ask
}