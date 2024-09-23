const { replacePlaceHolderInformation, getCategoryGroups } = require('../utils')

module.exports.run = (client, message, args) => {

    const content = replacePlaceHolderInformation(`Hi {name},\nThis bot's purpose is to answer frequently asked questions about modding KTANE. Its goal is to alleviate answering duplicate questions in <#{modCreationId}> and <#{repoDiscussionId}>. Please try to see if your question(s) are answered here before asking there. Navigate through the categories below to see which section your question falls under. Please report any bugs or suggestions about the bot via a [github issue]()`, 
        {name: message.author.username});
    
    //separate the categories into groups 
    const groups = getCategoryGroups();

    console.log(groups)

    
    //todo make embeds like pages
    message.channel.send(content);

}
