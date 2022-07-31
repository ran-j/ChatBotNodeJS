const Global = require('../../Libs/Global');

const buildAgent = async (req, res, next) => {
    if (Global.AgentInstance.isAgentBuilding) return res.status(403).end('Agent are building');
    try {
        await Global.AgentInstance.buildAgent(true)
        res.end("done")
    } catch (error) {
        console.error(error)
        res.status(500).end('Erro on build agent');
    }
}

const ask = async (req, res, next) => {
    try {
        const resp = await Global.AgentInstance.response(req.body.say, req.body.uID, true)
        res.end(resp)
    } catch (error) {
        res.end("Ops, internal error X(")
    }
}

module.exports = {
    buildAgent,
    ask
}