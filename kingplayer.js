"use strict";

let _fs = require("fs");

let _config = {
	feature: "distribution", // Can be "PLAY", "DISTRIBUTION"
	game: {
		players: 5, // Allows 2-52
	},
	features: {
		play: {
			log: true, // TRUE to log each game event to the console
			plotFile: "gamePlot.txt" // Leave BLANK ("") for no file write
		},
		distribution: {
			iterations: 1000000,
			log: 100000,
			output: "distribution.txt"
		}
	}
};

_config.feature = _config.feature.toUpperCase();

if(_config.game.players < 2 || _config.game.players > 52)
{
	console.log("Config allows 2-52 players. "+ _config.game.players +" is invalid.");
	process.exit();
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
		ARRAY players [INTEGER index] = OBJECT Player
	): BOOLEAN
*/
function MoreThanOnePlayerHasCards(players)
{
	let hands = 0;
	
	for(let i = 0, n = players.length; i < n; i++)
	{
		if(players[i].hand.length > 0)
		{
			if(++hands == 2)
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
function PlayOneGame(deck)
{
	GameLog("[G] This game has "+ _config.game.players +" players.");
	GameLog("[G] Dealing...");
	
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
	
	while(MoreThanOnePlayerHasCards(players))
	{
		let nextCard = players[playerTurn].hand.shift();
		
		pile.unshift(nextCard);
		placeCount++;
		
		let logLeader = ((taxesDemanded > 0) ? "[T]" : "[P]");
		let logEnder = ((nextCard.DemandsTaxes()) ? " This demands a tax of "+ _taxation[nextCard.type] +" cards from the next player." : "");
		
		GameLog(logLeader +" Player "+ players[playerTurn].id +" places "+ nextCard.type +" on the pile. "+ players[playerTurn].hand.length +" cards left."+ logEnder);
		
		if(nextCard.DemandsTaxes())
		{
			taxesDemanded = _taxation[nextCard.type];
			taxesPaid = 0;
			
			for(let i = 0; i < players.length; i++)
			{
				if(i != playerTurn && players[i].hand.length == 0)
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
				
				playerTurn = grabber;
			}
			
			let playerPurged = false;
			
			for(let i = 0; i < players.length; i++)
			{
				if(players[i].hand.length == 0)
				{
					GameLog("[L] Player "+ players[i].id +" is out of the game!");
					
					players.splice(i, 1);
					
					playerPurged = true;
				}
			}
			
			if(playerPurged)
			{
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

if(_config.feature == "PLAY")
{
	PlayOneGame(ShuffledDeck());
}
else if(_config.feature == "DISTRIBUTION")
{
	//Distribution();
}
else
{
	console.log("Please configure a feature.");
}


for(let i = 5; i <= 52; i++)
{
	console.log("===");
	console.log(i);
	_config.game.players = i;
	_config.features.distribution.output = "distribution_"+ i +".txt";
	
	Distribution();
}

























