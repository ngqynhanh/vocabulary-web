class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str):
        node = self.root
        for c in word:
            if c not in node.children:
                node.children[c] = TrieNode()
            node = node.children[c]
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self._get_node(word)
        return node.is_end if node else False

    def starts_with(self, prefix: str):
        node = self._get_node(prefix)
        if not node:
            return []
        result = []
        self._dfs(prefix, node, result)
        return result

    def _get_node(self, prefix: str):
        node = self.root
        for c in prefix:
            if c not in node.children:
                return None
            node = node.children[c]
        return node

    def _dfs(self, prefix, node, result):
        if node.is_end:
            result.append(prefix)
        for c, nxt in node.children.items():
            self._dfs(prefix + c, nxt, result)
