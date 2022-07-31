const Global = require('../../Libs/Global');

const buildAgent = async (req, res, next) => {
    if (Global.AgentInstance.isAgentBuilding) return res.status(403).end('Agent are building');
    try {
        const fullBuild = true
        await Global.AgentInstance.buildAgent(fullBuild)
        res.end("done")
    } catch (error) {
        console.error(error)
        res.status(500).end('Erro on build agent');
    }
}

const ask = async (req, res, next) => {
    try {
        const resp = await Global.AgentInstance.response(req.body.say, req.body.uID)
        res.json(resp)
    } catch (error) {
        res.end("Ops, internal error X(")
    }
}

module.exports = {
    buildAgent,
    ask
}