package com.example.smartdictionary;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Trie {
    
    private class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        boolean isEndOfWord = false;
    }

    private final TrieNode root;

    public Trie() {
        root = new TrieNode();
    }

    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toLowerCase().toCharArray()) {
            node.children.putIfAbsent(c, new TrieNode());
            node = node.children.get(c);
        }
        node.isEndOfWord = true;
    }

    public List<String> searchPrefix(String prefix) {
        TrieNode node = root;
        List<String> results = new ArrayList<>();
        
        // Navigate to the end of the prefix
        for (char c : prefix.toLowerCase().toCharArray()) {
            if (!node.children.containsKey(c)) {
                return results; // Return empty list if prefix not found
            }
            node = node.children.get(c);
        }
        
        // Perform DFS to find all words from this node
        dfs(node, prefix, results);
        return results;
    }

    private void dfs(TrieNode node, String currentPrefix, List<String> results) {
        if (results.size() >= 5) return; // Limit suggestions
        
        if (node.isEndOfWord) {
            results.add(currentPrefix);
        }

        for (Map.Entry<Character, TrieNode> entry : node.children.entrySet()) {
            dfs(entry.getValue(), currentPrefix + entry.getKey(), results);
        }
    }
}