package com.example.smartdictionary;

import java.util.Stack;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;

public class HistoryStack {
    
    private final Stack<String> stack = new Stack<>();

    public void push(String word) {
        // Avoid duplicates at the very top
        if (stack.isEmpty() || !stack.peek().equals(word)) {
            stack.push(word);
        }
    }

    public List<String> getHistory() {
        // Convert to list and reverse to show newest first
        List<String> historyList = new ArrayList<>(stack);
        Collections.reverse(historyList);
        return historyList;
    }
}