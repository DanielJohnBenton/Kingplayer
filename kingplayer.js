"use strict";

let _fs = require("fs");

let _config = {
	feature: "random", // Can be "PLAY", "DISTRIBUTION", "GENETIC", "RANDOM"
	game: {
		players: 2, // Allows 2-52
		infiniteFlag: 50000
	},
	features: {
		play: {
			log: true, // TRUE to log each game event to the console
			plotFile: "gamePlot.txt", // Leave BLANK ("") for no file write
			load: "random/4084.txt" // Load deck from a file instead of shuffling a new deck - leave BLANK ("") to use shuffled deck
		},
		distribution: {
			iterations: 100,
			log: 10,
			output: "distribution.txt"
		},
		genetic: {
			goal: "longest", // "SHORTEST", "LONGEST"
			iterations: 4000,
			log: 1,
			population: 2500,
			elitism: 100,
			selection: 1000,
			mutationRatePercentage: 5,
			output: "evolved_deck.txt"
		},
		random: {
			goal: "longest", // "SHORTEST", "LONGEST"
			directory: "random/",
			log: 1000000,
			minimumForLongest: 4000,
			maximumForShortest: 34,
			safetyFileLimit: 10000
		}
	}
};

if(_config.game.players < 2 || _config.game.players > 52)
{
	console.log("Config allows 2-52 players. "+ _config.game.players +" is invalid.");
	process.exit();
}

_config.feature = _config.feature.toUpperCase();

_config.features.genetic.goal = _config.features.genetic.goal.toUpperCase();
_config.features.random.goal = _config.features.random.goal.toUpperCase();

if(_config.features.random.directory.charAt(_config.features.random.directory - 1) != "/")
{
	_config.features.random.directory +="/";
}

let _taxation = {
	Jack: 1,
	Queen: 2,
	King: 3,
	Ace: 4
};

/*
	Defined (
		STRING type
	): BOOLEAN
*/
function Defined(type)
{
	return (type !== "undefined");
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
	ReadFile (
		STRING path
	): STRING
*/
function ReadFile(path)
{
	return _fs.readFileSync(path, "utf8").toString();
}

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
	OBJECT Card (
		STRING suit,
		STRING|INTEGER type
	)
*/
function Card(suit, type)
{
	this.suit = suit;
	this.type = type;
}

/*
	Card.DemandsTaxes (
	): BOOLEAN
*/
Card.prototype.DemandsTaxes = function()
{
	return (this.type == "Jack" || this.type == "Queen" || this.type == "King" || this.type == "Ace");
}

/*
	ShuffledDeck (
	): ARRAY [INTEGER index] = OBJECT Card
*/
function ShuffledDeck()
{
	let suits = ["hearts", "diamonds", "clubs", "spades"];
	
	let unshuffled = [];
	
	for(let iSuits = 0; iSuits < 4; iSuits++)
	{
		unshuffled.push(new Card(suits[iSuits], "Ace"));
		
		for(let cardNumber = 2; cardNumber <= 10; cardNumber++)
		{
			unshuffled.push(new Card(suits[iSuits], cardNumber));
		}
		
		unshuffled.push(new Card(suits[iSuits], "Jack"));
		unshuffled.push(new Card(suits[iSuits], "Queen"));
		unshuffled.push(new Card(suits[iSuits], "King"));
	}
	
	let shuffled = [];
	
	while(unshuffled.length > 0)
	{
		shuffled.push(unshuffled.splice(Random(0, unshuffled.length - 1), 1)[0]);
	}
	
	return shuffled;
}

/*
	LoadDeckFromFile (
		STRING path
	): ARRAY [INTEGER index] = OBJECT Card
*/
function LoadDeckFromFile(path)
{
	let loaded = JSON.parse(ReadFile(path)).deck;
	let deck = [];
	
	for(let i = 0, n = loaded.length; i < n; i++)
	{
		deck.push(new Card(loaded[i].suit, loaded[i].type));
	}
	
	return deck;
}

/*
	GameLog (
		STRING message
	): VOID
*/
function GameLog(message)
{
	if(_config.features.play.log && _config.feature == "PLAY")
	{
		console.log(message);
	}
}

/*
	OBJECT Player (
		INTEGER id
	)
*/
function Player(id)
{
	this.id = id;
	this.hand = [];
}

/*
	Players (
		INTEGER n
	): ARRAY [INTEGER index] = OBJECT Player
*/
function Players(n)
{
	let players = [];
	
	for(let i = 1; i <= n; i++)
	{
		players.push(new Player(i));
	}
	
	return players;
}

/*
	MoreThanOnePlayerHasCards (
		ARRAY players [INTEGER index] = OBJECT Player,
		INTEGER owed
	): BOOLEAN
*/
function MoreThanOnePlayerActive(players, owed)
{
	let active = 0;
	
	for(let i = 0, n = players.length; i < n; i++)
	{
		if(players[i].hand.length > 0 || i == owed)
		{
			if(++active == 2)
			{
				return true;
			}
		}
	}
	
	return false;
}

/*
	NextPlayer (
		ARRAY players [INTEGER index] = OBJECT Player,
		INTEGER turn
	): INTEGER turn
*/
function NextPlayer(players, turn)
{
	turn++;
	
	if(turn >= players.length)
	{
		turn = 0;
	}
	
	return turn;
}

/*
	PreviousPlayer (
		ARRAY players [INTEGER index] = OBJECT Player,
		INTEGER turn
	): INTEGER turn
*/
function PreviousPlayer(players, turn)
{
	turn--;
	
	if(turn < 0)
	{
		turn = players.length - 1;
	}
	
	return turn;
}

/*
	GamePlot (
		ARRAY plot [STRING lookup] [INTEGER index] = INTEGER,
		ARRAY players [INTEGER index] = OBJECT Player,
		ARRAY ids [INTEGER index] = STRING
	): ARRAY [STRING lookup] [INTEGER index] = INTEGER
*/
function GamePlot(plot, players, ids)
{
	if(_config.feature == "PLAY" && _config.features.play.plotFile != "")
	{
		for(let iIds = 0, nIds = ids.length; iIds < nIds; iIds++)
		{
			let plotted = false;
			
			for(let iPlayers = 0, nPlayers = players.length; iPlayers < nPlayers; iPlayers++)
			{
				if(players[iPlayers].id == ids[iIds])
				{
					plot["_"+ ids[iIds]].push(players[iPlayers].hand.length);
					plotted = true;
				}
			}
			
			if(!plotted)
			{
				plot["_"+ ids[iIds]].push(0);
			}
		}
	}
	
	return plot;
}

/*
	GamePlotToFile (
		ARRAY plot [STRING lookup] [INTEGER index] = INTEGER,
		ARRAY ids [INTEGER index] = STRING
	): VOID
*/
function GamePlotToFile(plot, ids)
{
	if(_config.feature == "PLAY" && _config.features.play.plotFile != "")
	{
		let xLastId = ids.length - 1;
		
		let file = "";
		
		for(let iIds = 0; iIds <= xLastId; iIds++)
		{
			file += "Player "+ ids[iIds] + ((iIds != xLastId) ? "\t" : ""); 
		}
		
		file +="\n";
		
		for(let iPlot = 0, xLastPlot = plot["_1"].length - 1; iPlot <= xLastPlot; iPlot++)
		{
			for(let iIds = 0; iIds <= xLastId; iIds++)
			{
				file += plot["_"+ ids[iIds]][iPlot] + ((iIds != xLastId) ? "\t" : ""); 
			}
			
			if(iPlot != xLastPlot)
			{
				file +="\n";
			}
		}
		
		WriteFile(_config.features.play.plotFile, file);
	}
}

/*
	PlayOneGame (
		ARRAY deck [INTEGER index] = OBJECT Card
	): INTEGER
*/
function PlayOneGame(initialDeck)
{
	GameLog("[G] This game has "+ _config.game.players +" players.");
	GameLog("[G] Dealing...");
	
	let checkedInfiniteGame = false;
	
	let deck = initialDeck.slice();
	
	let players = Players(_config.game.players);
	let pile = [];
	
	let dealToPlayer = 0;
	
	while(deck.length > 0)
	{
		players[dealToPlayer].hand.unshift(deck.shift());
		
		dealToPlayer = NextPlayer(players, dealToPlayer);
	}
	
	let gamePlot = [];
	let initialPlayerIds = [];
	
	for(let i = 0, n = players.length; i < n; i++)
	{
		initialPlayerIds.push(players[i].id);
		
		gamePlot["_"+ players[i].id] = [];
	}
	
	gamePlot = GamePlot(gamePlot, players, initialPlayerIds);
	
	let playerTurn = 0;
	
	let taxesDemanded = 0;
	let taxesPaid = 0;
	
	let placeCount = 0;
	
	let owed = -1;
	
	while(MoreThanOnePlayerActive(players, owed))
	{
		let nextCard = players[playerTurn].hand.shift();
		
		pile.unshift(nextCard);
		placeCount++;
		
		if(!checkedInfiniteGame && placeCount >= _config.game.infiniteFlag)
		{
			WriteFile("POSSIBLE_INFINITE_GAME.txt", JSON.stringify({deck: initialDeck}));
			console.log("POSSIBLE INFINITE GAME DETECTED!!! - SAVED DECK TO FILE");
			
			checkedInfiniteGame = true;
		}
		
		let logLeader = ((taxesDemanded > 0) ? "[T]" : "[P]");
		let logEnder = ((nextCard.DemandsTaxes()) ? " This demands a tax of "+ _taxation[nextCard.type] +" cards from the next player." : "");
		
		GameLog(logLeader +" Player "+ players[playerTurn].id +" places "+ nextCard.type +" on the pile. "+ players[playerTurn].hand.length +" cards left."+ logEnder);
		
		if(nextCard.DemandsTaxes())
		{
			taxesDemanded = _taxation[nextCard.type];
			taxesPaid = 0;
			
			owed = playerTurn;
			
			for(let i = 0; i < players.length; i++)
			{
				if(i != playerTurn && players[i].hand.length == 0 && i != owed)
				{
					GameLog("[L] Player "+ players[i].id +" is out of the game!");
					
					players.splice(i, 1);
				}
			}
			
			playerTurn = NextPlayer(players, playerTurn);
		}
		else if(taxesDemanded > 0)
		{
			taxesPaid++;
			
			if(taxesPaid == taxesDemanded)
			{
				let grabber = PreviousPlayer(players, playerTurn);
				
				players[grabber].hand = players[grabber].hand.concat(pile);
				
				pile = [];
				
				taxesPaid = 0;
				taxesDemanded = 0;
				
				GameLog("[T] Player "+ players[grabber].id +" grabs the pile and adds it to the bottom of theirs. Now they have "+ players[grabber].hand.length +" cards.");
				
				owed = -1;
				
				playerTurn = grabber;
			}
			
			let playerPurged = false;
			
			for(let i = 0; i < players.length; i++)
			{
				if(players[i].hand.length == 0 && i != owed)
				{
					GameLog("[L] Player "+ players[i].id +" is out of the game!");
					
					players.splice(i, 1);
					
					playerPurged = true;
				}
			}
			
			if(playerPurged)
			{
				if(_config.game.players == 2)
				{
					gamePlot = GamePlot(gamePlot, players, initialPlayerIds);
					break;
				}
				
				playerTurn = NextPlayer(players, playerTurn);
			}
		}
		else
		{
			if(players[playerTurn].hand.length == 0)
			{
				GameLog("[L] Player "+ players[playerTurn].id +" is out of the game!");
			
				players.splice(playerTurn, 1);
			}
			
			playerTurn = NextPlayer(players, playerTurn);
		}
		
		gamePlot = GamePlot(gamePlot, players, initialPlayerIds);
	}
	
	for(let i = 0, n = players.length; i < n; i++)
	{
		if(players[i].hand.length > 0)
		{
			GameLog("[G] Player "+ players[i].id +" wins!");
			GameLog(placeCount +" cards were placed during the game.");
			break;
		}
	}
	
	GamePlotToFile(gamePlot, initialPlayerIds);
	
	return placeCount;
}

/*
	Distribution (
	): VOID
*/
function Distribution()
{
	let highest = 0;
	
	let counts = [];
	
	let total = 0;
	
	for(let i = 1; i <= _config.features.distribution.iterations; i++)
	{
		let nPlaces = PlayOneGame(ShuffledDeck());
		
		total += nPlaces;
		
		if(Defined(typeof(counts["_"+ nPlaces])))
		{
			counts["_"+ nPlaces]++;
		}
		else
		{
			counts["_"+ nPlaces] = 1;
		}
		
		if(nPlaces > highest)
		{
			highest = nPlaces;
		}
		
		if((_config.features.distribution.log > 0) && ((i % _config.features.distribution.log) == 0))
		{
			console.log(i +" games played ("+ ((i / _config.features.distribution.iterations) * 100).toFixed(2) +" % complete)");
		}
	}
	
	let file = "";
	
	for(let i = 1; i <= highest; i++)
	{
		if(i > 1)
		{
			file +="\n";
		}
		
		file += i +"\t";
		
		if(Defined(typeof(counts["_"+ i])))
		{
			file += counts["_"+ i];
		}
		else
		{
			file +="0";
		}
	}
	
	WriteFile(_config.features.distribution.output, file, "utf8");
	
	console.log("'"+ _config.features.distribution.output +"' generated.");
	console.log("Mean average: "+ (total / _config.features.distribution.iterations));
}

/*
	OBJECT Gene (
		ARRAY deck [INTEGER index] = OBJECT Card
	)
*/
function Gene(deck)
{
	this.deck = deck;
	this.placeCount = PlayOneGame(deck);
}

/*
	SortGamesForShortest (
		OBJECT Gene a,
		OBJECT Gene b
	): INTEGER
*/
function SortGamesForShortest(a, b)
{
	return a.placeCount - b.placeCount;
}

/*
	SortGamesForLongest (
		OBJECT Gene a,
		OBJECT Gene b
	): INTEGER
*/
function SortGamesForLongest(a, b)
{
	return b.placeCount - a.placeCount;
}

/*
	SortPopulation (
		ARRAY decks [INTEGER index] = OBJECT Gene
	): VOID
*/
function SortPopulation(decks)
{
	decks.sort(
		((_config.features.genetic.goal == "LONGEST") ? SortGamesForLongest : SortGamesForShortest)
	);
}

/*
	MutateDeck (
		ARRAY deck [INTEGER index] = OBJECT Card
	): ARRAY deck [INTEGER index] = OBJECT Card
*/
function MutateDeck(deck)
{
	let newDeck = deck.slice();
	
	for(let i = 0, n = newDeck.length; i < n; i++)
	{
		if(Random(1, 100) <= _config.features.genetic.mutationRatePercentage)
		{
			let swapCard = Random(0, n - 1);
			let tempCard = new Card(newDeck[i].suit, newDeck[i].type);
			
			newDeck[i] = new Card(newDeck[swapCard].suit, newDeck[swapCard].type);
			newDeck[swapCard] = new Card(tempCard.suit, tempCard.type);
		}
	}
	
	return newDeck;
}

/*
	EvolvePopulation (
		ARRAY [INTEGER index] = OBJECT Gene
	): ARRAY [INTEGER index] = OBJECT Gene
*/
function EvolvePopulation(decks)
{
	let newDecks = [];
	
	for(let iElites = 0; iElites < _config.features.genetic.elitism; iElites++)
	{
		newDecks[iElites] = decks[iElites];
	}
	
	let selectedDecks = decks.slice(0, _config.features.genetic.selection);
	
	for(let iDecks = _config.features.genetic.elitism; iDecks < _config.features.genetic.population; iDecks++)
	{
		newDecks[iDecks] = new Gene(MutateDeck(decks[Random(0, _config.features.genetic.selection - 1)].deck));
	}
	
	SortPopulation(newDecks);
	
	return newDecks;
}

/*
	GeneticAlgorithm (
	): VOID
*/
function GeneticAlgorithm()
{
	let decks = [];
	
	for(let i = 0; i < _config.features.genetic.population; i++)
	{
		decks[i] = new Gene(ShuffledDeck());
	}
	
	SortPopulation(decks);
	
	console.log("[Initial] "+ decks[0].placeCount);
	
	for(let i = 1; i <= _config.features.genetic.iterations; i++)
	{
		decks = EvolvePopulation(decks);
		
		if(_config.features.genetic.output != "")
		{
			WriteFile(_config.features.genetic.output, JSON.stringify(decks[0]));
		}
		
		if((i % _config.features.genetic.log) == 0)
		{
			console.log("[Generation "+ i +"] "+ decks[0].placeCount);
		}
	}
}

/*
	RandomGames (
	): VOID
*/
function RandomGames()
{
	let cGamesPlayed = 0;
	let cFilesCreated = 0;
	
	let playForLongest = (_config.features.random.goal == "LONGEST");
	
	let bestSoFar = (playForLongest ? _config.features.random.minimumForLongest : _config.features.random.maximumForShortest);
	
	console.log("Playing lots of shuffled decks to find the "+ _config.features.random.goal +" game between "+ _config.game.players +" players.");
	console.log("Must do better than "+ bestSoFar +" before solutions will be logged/saved.");
	console.log("A maximum of "+ _config.features.random.safetyFileLimit +" files can be created, at which point the search will halt.");
	
	while(cFilesCreated < _config.features.random.safetyFileLimit)
	{
		let deck = ShuffledDeck();
		
		let gameLength = PlayOneGame(deck);
		cGamesPlayed++;
		
		if((cGamesPlayed % _config.features.random.log) == 0)
		{
			console.log("[LOG] "+ cGamesPlayed +" games have been played so far. "+ cFilesCreated +" files have been created so far.");
		}
		
		if(
		(playForLongest && gameLength > bestSoFar) ||
		(!playForLongest && gameLength < bestSoFar))
		{
			WriteFile(_config.features.random.directory + gameLength +".txt", JSON.stringify({deck: deck}));
			
			console.log("[!!!] New solution discovered: "+ gameLength +". "+ (++cFilesCreated) +" files have been created so far.");
			
			bestSoFar = gameLength;
		}
	}
	
	console.log(cFilesCreated +" files created limit reached - end search.");
}

// =========================================================================================
if(_config.feature == "PLAY")
{
	let deck = [];
	
	if(_config.features.play.load != "")
	{
		deck = LoadDeckFromFile(_config.features.play.load);
		GameLog("Pre-sorted deck loaded from '"+ _config.features.play.load +"'.");
	}
	else
	{
		deck = ShuffledDeck();
		GameLog("Deck shuffled.");
	}
	
	PlayOneGame(deck);
}
else if(_config.feature == "DISTRIBUTION")
{
	Distribution();
}
else if(_config.feature == "GENETIC")
{
	GeneticAlgorithm();
}
else if(_config.feature == "RANDOM")
{
	RandomGames();
}
else
{
	console.log("Please configure a feature.");
}
// =========================================================================================

























