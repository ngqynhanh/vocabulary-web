package com.example.smartdictionary;

public class FlashcardList {

    static class CardNode {
        String word;
        String definition;
        CardNode next;

        public CardNode(String word, String definition) {
            this.word = word;
            this.definition = definition;
        }
    }

    private CardNode head = null;
    private CardNode current = null;

    public void add(String word, String definition) {
        CardNode newNode = new CardNode(word, definition);
        
        if (head == null) {
            head = newNode;
            head.next = head; // Point to itself
            current = head;
        } else {
            CardNode temp = head;
            while (temp.next != head) {
                temp = temp.next;
            }
            temp.next = newNode;
            newNode.next = head;
        }
    }

    public CardNode getNext() {
        if (current == null) return null;
        CardNode data = current;
        current = current.next;
        return data;
    }
}