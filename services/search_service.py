from ds.levenshtein import levenshtein

class SearchService:
    def __init__(self, trie):
        self.trie = trie

    def search(self, word: str):
        found = self.trie.search(word)
        prefix = self.trie.starts_with(word)

        # Autocorrect: distance <= 2
        suggestions = self.trie.starts_with(word[0]) if word else []
        autocorrect = [s for s in suggestions if levenshtein(s, word) <= 2]

        return {
            "found": found,
            "suggestions": prefix,
            "autocorrect": autocorrect
        }
