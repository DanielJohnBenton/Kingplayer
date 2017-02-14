#include <iostream>
#include <string>
#include <sstream>
#include <fstream>
#include <algorithm>
#include <ctime>

using namespace std;

// http://stackoverflow.com/a/20861692
namespace patch
{
    template<typename T> std::string to_string( const T& n )
    {
        std::ostringstream stm;
        stm << n;
        return stm.str();
    }
}

unsigned int PlayOneGame(string deck)
{
	string players[2];
	players[0] = deck.substr(0, 26);
	players[1] = deck.substr(26, 26);
	
	string pile = "";
	
	unsigned int placeCount = 0;
	
	signed short turn = 0;
	
	const unsigned int infiniteFlag = 50000;
	bool checkedInfiniteGame = false;
	
	while(players[0] != "" && players[1] != "")
	{
		bool battleInProgress = false;
		unsigned short debt = 1;
		
		while(debt > 0)
		{
			if(players[turn] == "")
			{
				break;
			}
			
			char nextCard = players[turn].at(0);
			players[turn] = players[turn].substr(1, players[turn].length());
			
			pile += nextCard;
			
			placeCount++;
			
			if(!checkedInfiniteGame && placeCount >= infiniteFlag)
			{
				ofstream file;
				file.open("POSSIBLE_INFINITE_GAME.txt");
				file << deck;
				file.close();
				
				cout <<"POSSIBLE INFINITE GAME DETECTED!!! - SAVED DECK TO FILE"<< endl;
				
				checkedInfiniteGame = true;
			}
			
			if(nextCard == '-')
			{
				if(battleInProgress)
				{
					debt--;
				}
				else
				{
					turn = ((turn == 1) ? 0 : 1);
				}
			}
			else
			{
				battleInProgress = true;
				
				switch(nextCard)
				{
					case 'A':
						debt = 4;
						break;
					
					case 'K':
						debt = 3;
						break;
					
					case 'Q':
						debt = 2;
						break;
					
					case 'J':
						debt = 1;
						break;
					
					default:
						debt = 0;
						break;
				}
				
				turn = ((turn == 1) ? 0 : 1);
			}
		}
		
		turn = ((turn == 1) ? 0 : 1);
		
		players[turn] += pile;
		pile = "";
	}
	
	return placeCount;
}

string ShuffledDeck()
{
	string cards = "------------------------------------AAAAJJJJKKKKQQQQ";
	
	random_shuffle(cards.begin(), cards.end());
	
	return cards;
}

void RandomGames()
{
	// configurations:
	const unsigned short safetyFileLimit = 10000;
	const unsigned long log = 1000000;
	const string directory = "random/";
	
	unsigned long long cGamesPlayed = 0;
	unsigned short cFilesCreated = 0;
	
	unsigned int bestSoFar = 4000;
	
	cout <<"Playing lots of shuffled decks to find the LONGEST game between 2 players."<< endl;
	cout <<"Must do better than "<< bestSoFar <<" before solutions will be logged/saved."<< endl;
	cout <<"A maximum of "<< safetyFileLimit <<" files can be created, at which point the search will halt."<< endl;
	
	while(cFilesCreated < safetyFileLimit)
	{
		string deck = ShuffledDeck();
		
		unsigned int gameLength = PlayOneGame(deck);
		
		if((++cGamesPlayed % log) == 0)
		{
			cout <<"[LOG] "<< cGamesPlayed <<" games played. "<< cFilesCreated <<" files created."<< endl;
		}
		
		if(gameLength > bestSoFar)
		{
			string fileName = directory + patch::to_string(gameLength) +".txt";
			
			ofstream file;
			file.open(fileName.c_str());
			file << deck;
			file.close();
			
			cout <<"[!!!] New solution discovered: "<< gameLength <<". "<< ++cFilesCreated <<" files created."<< endl;
			
			bestSoFar = gameLength;
		}
	}
}

void Permutations()
{
	// configurations:
	const unsigned short safetyFileLimit = 10000;
	const unsigned long log = 10000000;
	const unsigned long save = 10000000;
	const string directory = "permutations/";
	
	unsigned long long cGamesPlayed = 0;
	unsigned short cFilesCreated = 0;
	
	unsigned int bestSoFar = 2000;
	
	ifstream startFile("permutations/start.txt");
	string deck = "";
	getline(startFile, deck);
	startFile.close();
	
	cout <<"Permutations starting at:"<< endl << deck << endl;
	
	bool playing = false;
	
	long long i = 0;
	
	while(next_permutation(deck.begin(), deck.end()) && cFilesCreated < safetyFileLimit)
	{
		if(playing)
		{
			unsigned int gameLength = PlayOneGame(deck);
			
			cGamesPlayed++;
			
			if(cGamesPlayed % log == 0)
			{
				cout <<"[LOG] "<< cGamesPlayed <<" games played. "<< cFilesCreated <<" files created."<< endl;
			}
			
			if(cGamesPlayed % save == 0)
			{
				cout <<"[LOG] Saving deck to file: "<< deck << endl;
				
				ofstream file;
				file.open("permutations/start.txt");
				file << deck;
				file.close();
			}
			
			if(gameLength > bestSoFar)
			{
				string fileName = directory + patch::to_string(gameLength) +".txt";
				
				ofstream file;
				file.open(fileName.c_str());
				file << deck;
				file.close();
				
				cout <<"[!!!] New solution discovered: "<< gameLength <<". "<< ++cFilesCreated <<" files created."<< endl;
				
				bestSoFar = gameLength;
			}
		}
		else
		{
			i++;
			
			if(i % 100000000 == 0)
			{
				cout <<"Saved ["<< i <<"] "<< deck << endl;
				
				ofstream file;
				file.open("permutations/start.txt");
				file << deck;
				file.close();
			}
				
			if(deck.at(25) == 'A' || deck.at(25) == 'K' || deck.at(25) == 'Q' || deck.at(25) == 'J')
			{
				playing = true;
				
				cout <<"Simulations begin."<< endl;
			}
		}
	}
}

int main()
{
	srand(time(0));
	
	Permutations();
	
	return 0;
}









