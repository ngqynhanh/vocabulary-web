import requests
from ds.trie import Trie

class DictionaryLoader:
    def __init__(self):
        self.trie = Trie()

    def load(self):
        url = "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt"
        print("⏳ Downloading dictionary...")
        data = requests.get(url).text.split("\n")

        for word in data:
            if word.strip():
                self.trie.insert(word.strip())

        print("✅ Dictionary loaded:", len(data), "words")

    def get_trie(self):
        return self.trie
