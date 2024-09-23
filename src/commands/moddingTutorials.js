const { replacePlaceHolderInformation, questions } = require('../utils')

module.exports.run = (client, message, args) => {

    const question = questions.find(q => q.commandName === "moddingTutorials");
    const answer = replacePlaceHolderInformation(question.answer, {}) 
    message.channel.send(`### ${question.question}\n${answer}`);

}