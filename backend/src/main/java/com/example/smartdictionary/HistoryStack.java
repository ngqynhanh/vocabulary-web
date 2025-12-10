package com.example.smartdictionary;

import java.util.Stack;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;

public class HistoryStack {
    
    private final Stack<String> stack = new Stack<>();

    public void push(String word) {
        // Remove any existing occurrence to avoid repeated entries in history
        stack.removeIf(w -> w.equals(word));
        stack.push(word);

        // Optional: cap history length to avoid unbounded growth
        int maxSize = 100;
        while (stack.size() > maxSize) {
            stack.remove(0); // remove oldest
        }
    }

    public List<String> getHistory() {
        // Convert to list and reverse to show newest first
        List<String> historyList = new ArrayList<>(stack);
        Collections.reverse(historyList);
        return historyList;
    }
}