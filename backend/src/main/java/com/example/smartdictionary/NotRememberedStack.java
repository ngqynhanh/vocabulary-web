package com.example.smartdictionary;

import java.util.Stack;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;

/**
 * Stack to store words that were not remembered during flashcard review.
 * Provides methods to push, peek list for re-study, and clear once done.
 */
public class NotRememberedStack {

    private final Stack<String> stack = new Stack<>();

    public void push(String word) {
        if (word == null || word.isEmpty()) return;
        // Avoid duplicates at the very top
        if (stack.isEmpty() || !stack.peek().equals(word)) {
            stack.push(word);
        }
    }

    /**
     * Returns newest-first list of words not remembered.
     */
    public List<String> getPending() {
        List<String> list = new ArrayList<>(stack);
        Collections.reverse(list);
        return list;
    }

    /**
     * Remove a specific word from the stack.
     */
    public boolean remove(String word) {
        if (word == null || word.isEmpty()) return false;
        return stack.removeIf(w -> w.equals(word));
    }

    /**
     * Clears the stack after re-study.
     */
    public void clear() {
        stack.clear();
    }

    public boolean isEmpty() {
        return stack.isEmpty();
    }
}
