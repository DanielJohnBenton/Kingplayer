/*
	Version optimised for 2 players only to perform much quicker
	randomised and genetic searches.
	Notation and game algorithm based on beggarmypython.
*/

"use strict";

let _fs = require("fs");

let _config = {
	feature: "genetic",
	game: {
		infiniteFlag: 50000
	},
	random: {
		directory: "random/",
		log: 1000000,
		minimum: 4000,
		safetyFileLimit: 10000
	},
	genetic:
	{
		population: 100000,
		selection: 1000,
		elitism: 1,
		mutationRatePercentage: 10,
		minimum: 4000,
		lifespan: 100,
		lifespanAdd: 50,
		maxLifespan: 300,
		directory: "genetic/",
		safetyFileLimit: 10000
	}
};

_config.feature = _config.feature.toUpperCase();

let _taxes = [];
_taxes["A"] = 4; _taxes["K"] = 3; _taxes["Q"] = 2; _taxes["J"] = 1;

/*
	Random (
		INTEGER min,
		INTEGER max
	): INTEGER
*/
function Random(min, max)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
	ShuffledDeck (
	): STRING
*/
function ShuffledDeck()
{
	let cards = ["A", "A", "A", "A", "K", "K", "K", "K", "Q", "Q", "Q", "Q", "J", "J", "J", "J", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"];
	
	let deck = "";
	
	for(let i = 0; i < 52; i++)
	{
		deck += cards.splice(Random(0, cards.length - 1), 1)[0];
	}
	
	return deck;
}

/*
	PlayOneGame (
		STRING deck
	): INTEGER
*/
function PlayOneGame(deck)
{
	let players = [deck.substring(0, 26), deck.substring(26, 52)];
	
	let pile = "";
	
	let placeCount = 0;
	
	let turn = 0;
	
	let checkedInfiniteGame = false;
	
	while(players[0] != "" && players[1] != "")
	{
		let battleInProgress = false;
		let debt = 1;
		
		while(debt > 0)
		{
			if(players[turn] == "")
			{
				break;
			}
			
			let nextCard = players[turn].charAt(0);
			players[turn] = players[turn].substring(1, players[turn].length);
			
			pile += nextCard;
			
			placeCount++;
			
			if(!checkedInfiniteGame && placeCount >= _config.game.infiniteFlag)
			{
				WriteFile("POSSIBLE_INFINITE_GAME.txt", deck);
				console.log("POSSIBLE INFINITE GAME DETECTED!!! - SAVED DECK TO FILE");
				
				checkedInfiniteGame = true;
			}
			
			if(nextCard == "-")
			{
				if(battleInProgress)
				{
					debt--;
				}
				else
				{
					turn = (turn ? 0 : 1);
				}
			}
			else
			{
				battleInProgress = true;
				debt = _taxes[nextCard];
				turn = (turn ? 0 : 1);
			}
		}
		
		players[(turn ? 0 : 1)] += pile;
		pile = "";
		
		turn = (turn ? 0 : 1);
	}
	
	return placeCount;
}

/*
	PlayOneGameFromSplit (
		STRING a,
		STRING b
	): INTEGER
*/
function PlayOneGameFromSplit(a, b)
{
	return PlayOneGame(a + b);
}

/*
	WriteFile (
		STRING path,
		STRING contents
	): VOID
*/
function WriteFile(path, contents)
{
	_fs.writeFileSync(path, contents, "utf8");
}

/*
	RandomGames (
	): VOID
*/
function RandomGames()
{
	let cGamesPlayed = 0;
	let cFilesCreated = 0;
	
	let bestSoFar = _config.random.minimum;
	
	console.log("Playing lots of shuffled decks to find the LONGEST game between 2 players.");
	console.log("Must do better than "+ bestSoFar +" before solutions will be logged/saved.");
	console.log("A maximum of "+ _config.random.safetyFileLimit +" files can be created, at which point the search will halt.");
	
	while(cFilesCreated < _config.random.safetyFileLimit)
	{
		let deck = ShuffledDeck();
		
		let gameLength = PlayOneGame(deck);
		
		if((++cGamesPlayed % _config.random.log) == 0)
		{
			console.log("[LOG] "+ cGamesPlayed +" games have been played so far. "+ cFilesCreated +" files have been created so far.");
		}
		
		if(gameLength > bestSoFar)
		{
			console.log("[!!!] New solution discovered: "+ gameLength +". "+ (++cFilesCreated) +" files have been created so far.");
			
			WriteFile(_config.random.directory + gameLength +".txt", deck);
			
			bestSoFar = gameLength;
		}
	}
}

/*
	OBJECT Gene (
		STRING deck
	)
*/
function Gene(deck)
{
	this.deck = deck;
	this.placeCount = PlayOneGame(deck);
}

/*
	SortPopulation (
		ARRAY decks [INTEGER] = OBJECT Gene
	): VOID
*/
function SortPopulation(decks)
{
	decks.sort(
		function(a, b)
		{
			return b.placeCount - a.placeCount;
		}
	);
}

/*
	LogFitness (
		ARRAY decks [INTEGER] = OBJECT gene,
		INTEGER life,
		BOOLEAN saved
	): VOID
*/
function LogFitness(decks, life, saved)
{
	let total = 0;
	let n = decks.length;
	
	for(let i = 0; i < n; i++)
	{
		total += decks[i].placeCount;
	}
	
	let average = total / n;
	
	console.log("Best: "+ decks[0].placeCount +" Average: "+ average.toFixed(2) + " Life: "+ life + (saved ? " --> saved" : ""));
}

/*
	MutateDeck (
		STRING deck
	): STRING
*/
function MutateDeck(deck)
{
	let offspring = deck.split("");
	
	for(let i = 0, n = offspring.length; i < n; i++)
	{
		if(offspring[i] != "-" && Random(1, 100) <= _config.genetic.mutationRatePercentage)
		{
			let swap = Random(0, n - 1);
			let temp = offspring[i];
			
			offspring[i] = offspring[swap];
			offspring[swap] = temp;
		}
	}
	
	return offspring.join("");
}

/*
	EvolvePopulation (
		ARRAY decks [INTEGER] = OBJECT Gene
	): ARRAY [INTEGER] = OBJECT Gene
*/
function EvolvePopulation(decks)
{
	let next = [];
	
	for(let iElites = 0; iElites < _config.genetic.elitism; iElites++)
	{
		next[iElites] = decks[iElites];
	}
	
	for(let i = _config.genetic.elitism; i < _config.genetic.population; i++)
	{
		next[i] = new Gene(MutateDeck(decks[Random(0, _config.genetic.selection)].deck));
	}
	
	SortPopulation(next);
	
	return next;
}

/*
	GeneticAlgorithm (
		INTEGER cFilesCreated
	): INTEGER
*/
function GeneticAlgorithm(cFilesCreated)
{
	console.log("Genetic algorithm begins.");
	
	let decks = [];
	
	for(let i = 0; i < _config.genetic.population; i++)
	{
		decks.push(new Gene(ShuffledDeck()));
	}
	
	SortPopulation(decks);
	
	let life = _config.genetic.lifespan;
	
	LogFitness(decks, life, false);
	
	let best = decks[0].placeCount;
	
	while(life > 0)
	{
		decks = EvolvePopulation(decks);
		
		let saved = false;
		
		if(decks[0].placeCount > best)
		{
			best = decks[0].placeCount;
			
			if(best > _config.genetic.minimum)
			{
				WriteFile(decks[0].placeCount +"__"+ Random(1, 100000) +".txt");
				
				saved = true;
				
				if(++cFilesCreated >= _config.genetic.safetyFileLimit)
				{
					console.log("Safety file limit reached.");
					process.exit();
				}
			}
			
			life += _config.genetic.lifespanAdd;
			
			if(life > _config.genetic.maxLifespan)
			{
				life = _config.genetic.maxLifespan;
			}
		}
		else
		{
			life--;
		}
		
		LogFitness(decks, life, saved);
	}
	
	console.log("Ran out of allowed lifespan.");
	
	return cFilesCreated;
}





if(_config.feature == "PLAY")
{
	PlayOneGame(ShuffledDeck());
}
else if(_config.feature == "RANDOM")
{
	RandomGames();
}
else if(_config.feature == "GENETIC")
{
	let cFilesCreated = 0;
	
	while(cFilesCreated < _config.genetic.safetyFileLimit)
	{
		cFilesCreated = GeneticAlgorithm(cFilesCreated);
	}
}
else
{
	console.log("Please configure a feature.");
}






