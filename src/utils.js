const dembParser = require("./dembParser.js")
const main = require('./main.js')
const discord = require('discord.js')
const { aliases } = require("./map.js")
const { GetMatching, ConvertToFull } = require("./commands/match.js")

class FakeArg {
	constructor(module) {
		this._ = module.split(" ")
	}
}



//the amount of questions/commands that will appear in one embed
const questionsPerPage = 3;

//the questions of the FAQ questions
const questions = [
	{
		question: "What is this?",
		category: "General",
		answer: "Hi {name},\nThis bot's purpose is to answer frequently asked questions about modding KTANE. Its goal is to alleviate answering duplicate questions in <#{modCreationId}> and <#{repoDiscussionId}>. Please try to see if your question(s) are answered here before asking there. Navigate through the categories below to see which section your question falls under. Please report any bugs or suggestions about the bot via a [github issue](https://github.com/BlckHawker/KTANE-FAQ-Bot/issues).",
		commandName: "faqHelp"
	},
	{
		question: "I don’t know how to start learning C#/Unity. How do I know when I learned enough to start modding?",
		category: "Getting Started",
		answer: "* C# resources:\n* [Video Tutorials](https://www.youtube.com/playlist?list=PL82C6-O4XrHcblXkHA4dLcnb_ipVkKHch)\n* [C# documentation](https://learn.microsoft.com/en-us/dotnet/csharp/)\n* [Codewars](https://www.codewars.com): Website that allows people to solve a variety of coding problems in various ranges of difficulty. Good to practice C# (or any other language) skills\n* Unity Resources:\n* [Unity Tutorial](https://www.youtube.com/watch?v=XtQMytORBmM)\n* [Unity Workshop](https://youtu.be/XcK0Y_PVyu8):  very similar to the first video teaching-wise, but you can try figuring out how to do both projects on your own fo\nmore practice\n* [Unity Documentation](https://docs.unity.com)\nThere isn’t a real answer to what is “enough” to start modding. You will learn new things as you continue using the tools. If you need to ask a question on how to do something, try googling it to see if someone else has asked the question before. If not, or you don’t understand the answer, you can try following what other people did in their mods (look at [other command] for more details). If you need more assistance, ask your question in <#{modCreationId}>.",
		commandName: "unityTutorials"
	},
	{
		question: "Are there any modding tutorials I can follow?",
		category: "Getting Started",
		answer: "Yes! There are several tutorials, though some of the information is outdated, the general steps are the same. Be sure to look at the [modkit wiki](https://github.com/Qkrisi/ktanemodkit/wiki) to see if something has been updated. It is also a good resource for understanding some methods/classes the modkit provides.\n### Regular Mods\n* [Deaf's video](https://youtu.be/YobuGSBl3i0) is very condensed and possibly best if for people who are proficient in C#/Unity.\n* [Royal_Flu$h's series](https://www.youtube.com/watch?v=Uwmm9iqAlV4&list=PL-1P5EmkkFxrwWW6z0uZ5nBdRImsReOQ0&index=6) takes a slower pace. Explaining the different aspects\nof module creation in more detail. Better for beginners.\n### Needy Mods\n* [Deaf's needy video](https://youtu.be/jnqxzVZYPHg) assume that you have watched his regular modding tutorial first\n### Boss Modules\n* [Insert info here]",
		commandName: "moddingTutorials"
	}
]

//the categores of the FAQ 
const categories = [
	{
		name: "General",
		description: "General questions about the bot"
	},
	{
		name: "Getting Started",
		description: "Set up questions getting into modding."
	},
	{
		name: "Manual",
		description: "Questions related to manuals and their publication."
	},
	{
		name: "Common Errors",
		description: "Common problems when creating a mod"
	}
]

const information = {
	repoDiscussionId: "640557658482540564",
	modCreationId: "201105291830493193"
};

const replacePlaceholderInformation = (message, args) => {
	//replace {name} with the person who made the request
	//replace {repoDiscussionId} the id of the repo-discussion channel
	//replace {modCreationId} the id of the mod-creation channel

	message = message.replaceAll("{name}", args.name)
		.replaceAll("{repoDiscussionId}", information.repoDiscussionId)
		.replaceAll("{modCreationId}", information.modCreationId)


	//replace markdown hyperlinks with <> so the embeds don't appear at the bottom of the message

	const gmRegex = /\[(.+)\]\((.+)\)/gm;
	const regex = /\[(.+)\]\((.+)\)/;

	const matches = message.match(gmRegex);

	if(matches) {
		for(const str of matches) {
			const match = str.match(regex);
			message = message.replaceAll(`[${match[1]}](${match[2]})`, `[${match[1]}](<${match[2]}>)`)
		}
	}
	

	return message;
}

//helper function that separates categories/questions into groups
const makeGroups = (arr) => {
    const groups = [];
    for(const text of arr) {
        //if groups is an empty arr, populate the first element as an array with the first text object
		//Otherwise, check if the last element of arr is "full"
        if (groups.length === 0 || groups[groups.length - 1].length >= questionsPerPage) {
            groups.push([text]);
        }

        else {
            groups[groups.length - 1].push(text);
        }
    }

    return groups;
}

const getCategoryGroups = () => {
	return makeGroups(categories);
}

const cleanseDiscordText = (text) => text.replace(/`/g, "");

function mostSimilarModule(searchItem, obj = undefined) {
	let keys = obj == undefined ? Array.from(main.ktaneModules().keys()) : Object.keys(obj).filter(key => key != undefined)
	let module = keys.sort((entry1, entry2) =>
		levenshteinRatio(entry2.toLowerCase(), searchItem) - levenshteinRatio(entry1.toLowerCase(), searchItem)
	)[0]
	if (levenshteinRatio(module.toLowerCase(), searchItem) < 0.7) return null
	return module
}

exports.parseDifficulty = d => !d ? "None" : d.startsWith('Very') ? d.replace('y', 'y ').trim() : d

const levenshteinRatio = (target, source) => {
	if (source == null || target == null) return 0.0
	if (source.length == 0 || target.length == 0) return 0.0
	if (source === target) return 1.0

	let sourceWordCount = source.length
	let targetWordCount = target.length

	let distance = new Array(sourceWordCount + 1)
	for (let i = 0; i < distance.length; i++) {
		distance[i] = new Array(targetWordCount + 1)
	}

	for (let i = 0; i <= sourceWordCount; distance[i][0] = i++);
	for (let j = 0; j <= targetWordCount; distance[0][j] = j++);

	for (let i = 1; i <= sourceWordCount; i++) {
		for (let j = 1; j <= targetWordCount; j++) {
			let cost = ((target.charAt(j - 1) === source.charAt(i - 1)) ? 0 : 1)

			distance[i][j] = Math.min(Math.min(distance[i - 1][j] + 1, distance[i][j - 1] + 1), distance[i - 1][j - 1] + cost)
		}
	}

	return 1.0 - distance[sourceWordCount][targetWordCount] / Math.max(source.length, target.length)
}

exports.GetModule = (message, args, send = true) => {
	if (args._.join(' ').includes("`")) {
		message.channel.send("Please don't use backticks in the input!")
		return undefined
	}
	let HandleRegex = result => {
		if (result.length == 1) return result[0].Module
		else {
			if (send) {
				let msg = `Expression is ambigious between ${result.length} modules${result.length > 10 ? "; showing first 10" : ""}:`
				let lines = []
				let ind = -1
				result.forEach(r => {
					ind++
					if (ind < 10) lines.push(r.MessageString)
				})
				message.channel.send(`${msg}\n${lines.join("\n")}`)
			}
			return undefined
		}
	}
	let modules = main.ktaneModules()
	let module = modules.get(aliases.get(args._[0].toString().toLowerCase()))
	if (!module) module = modules.get(args._.join(' ').toLowerCase())
	if (!module) module = modules.get(args._[0])
	if (!module) module = modules.get(mostSimilarModule(args._.join(' ').toLowerCase()))
	if (!module) {
		let result = GetMatching(ConvertToFull(args._.join(' ')))
		if (result && result.length > 0) return HandleRegex(result)
		else {
			result = GetMatching(args._.join(' '))
			if (result && result.length > 0)
				return HandleRegex(result)
			if (send) message.channel.send(result === null ? "Regular expression timeout" : `🚫 Couldn't find a module by the ID of \`${cleanseDiscordText(args._[0])}\` (case-sensitive), name of \`${cleanseDiscordText(args._.join(' '))}\` (not case-sensitive) or periodic symbol of \`${cleanseDiscordText(args._[0])}\` (not case-sensitive)`)
			return undefined
		}
	}
	return module
}

exports.CreateAPIMessage = async (channel, client, content) => {
	let { data, files } = await discord.MessagePayload.create(channel, content, { allowedMentions: {}, disableMentions: "none" }).resolveData().resolveFiles()
	let send = async (dataOverride = null, callback = _ => { }, ChannelOverride = null) => {
		if (dataOverride != null)
			data = dataOverride
		return await client.api.channels[ChannelOverride ?? channel.id].messages.post({ data, files }).then(async (d) => await callback(client.actions.MessageCreate.handle(d).message))
	}
	return { data, files, send }
}


const colors = [0x53FF00, 0x13FF00, 0x15B300, 0xFFFF00, 0xF91515, 0xA81313, 0x000000, 0x7289DA]
const difficulties = new Map([
	['Trivial', 0],
	['VeryEasy', 1],
	['Easy', 2],
	['Medium', 3],
	['Hard', 4],
	['VeryHard', 5],
	['Extreme', 6],
	['General', 7]
])

exports.FakeArg = FakeArg
exports.levenshteinRatio = levenshteinRatio
exports.mostSimilarModule = mostSimilarModule
exports.replacePlaceHolderInformation = replacePlaceholderInformation;
exports.difficulties = difficulties
exports.getColor = inputmodule => colors[Math.max(...new Array(inputmodule.DefuserDifficulty ? inputmodule.DefuserDifficulty : "General", inputmodule.ExpertDifficulty ? inputmodule.ExpertDifficulty : "General").map(e => difficulties.get(e)))]
exports.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
exports.embed = new dembParser([__dirname, "/embeds.demb"].join(""))
exports.questions = questions;
exports.categories = categories;
exports.getCategoryGroups = getCategoryGroups;


